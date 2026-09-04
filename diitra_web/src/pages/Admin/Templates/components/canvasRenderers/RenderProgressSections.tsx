import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Pencil, EyeOff, Plus, Check, X, Columns, RotateCcw } from 'lucide-react';
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
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || '1. DATOS GENERALES DEL PROYECTO (AUTO-POBLADOS)';
    const fields: ProgressHeaderField[] = (c.progressHeaderFields && Array.isArray(c.progressHeaderFields) && c.progressHeaderFields.length > 0)
        ? c.progressHeaderFields
        : DEFAULT_PROGRESS_HEADER_FIELDS;

    const headerColorMode = c.progressHeaderColor || 'navy';
    const borderStyleMode = c.progressHeaderBorder || 'solid';
    const headerPair = getHeaderStylePair(headerColorMode);
    const borderCss = borderStyleMode === 'none' ? 'border-0' : 'border border-slate-300';
    const cellBorderCss = borderStyleMode === 'none' ? 'border-b border-slate-100' : 'border border-slate-300';

    const activeFields = fields.filter(f => f.enabled);

    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [editingLabelText, setEditingLabelText] = useState<string>('');

    const handleUpdateLabel = (fieldId: string, newLabel: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
        onUpdateConfig(blockId, 'progressHeaderFields', updated);
        setEditingFieldId(null);
    };

    const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
        if (!onUpdateConfig || !blockId) return;
        const activeIdx = activeFields.findIndex(f => f.id === fieldId);
        if (activeIdx === -1) return;
        const targetActiveIdx = direction === 'up' ? activeIdx - 1 : activeIdx + 1;
        if (targetActiveIdx < 0 || targetActiveIdx >= activeFields.length) return;

        const targetField = activeFields[targetActiveIdx];
        const fromIdx = fields.findIndex(f => f.id === fieldId);
        const toIdx = fields.findIndex(f => f.id === targetField.id);

        const updated = [...fields];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        onUpdateConfig(blockId, 'progressHeaderFields', updated);
    };

    const handleToggleSpan = (fieldId: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = fields.map(f => f.id === fieldId ? { ...f, colSpan: f.colSpan === 2 ? 1 : 2 } : f);
        onUpdateConfig(blockId, 'progressHeaderFields', updated);
    };

    const handleHideField = (fieldId: string) => {
        if (!onUpdateConfig || !blockId) return;
        const updated = fields.map(f => f.id === fieldId ? { ...f, enabled: false } : f);
        onUpdateConfig(blockId, 'progressHeaderFields', updated);
    };

    const handleAddField = () => {
        if (!onUpdateConfig || !blockId) return;
        const newField: ProgressHeaderField = {
            id: `custom_hdr_${Date.now()}`,
            label: 'NUEVO CAMPO',
            fieldKey: `custom_${Date.now()}`,
            enabled: true,
            colSpan: 1,
            readOnly: false,
            placeholder: 'Redactar información...'
        };
        onUpdateConfig(blockId, 'progressHeaderFields', [...fields, newField]);
    };

    return (
        <div className="w-full text-slate-900 font-sans my-2 select-none">
            <div className={`w-full overflow-hidden rounded-xs ${borderCss}`}>
                {/* Header principal del bloque con edición de título */}
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                >
                    {onUpdateConfig && blockId ? (
                        <input
                            type="text"
                            value={displayTitle}
                            onChange={e => onUpdateConfig(blockId, 'title', e.target.value)}
                            className="bg-transparent border-b border-white/40 focus:border-white focus:outline-none py-0.5 text-[11px] font-bold uppercase tracking-wider text-white w-2/3"
                        />
                    ) : (
                        <span>{displayTitle}</span>
                    )}
                    <span className="text-[9px] opacity-80 font-normal">Identificación Institucional ISTPET</span>
                </div>

                {/* Grid de campos de encabezado */}
                <div className="grid grid-cols-2 bg-white">
                    {activeFields.map((field, idx) => {
                        const colSpanClass = field.colSpan === 2 ? 'col-span-2' : 'col-span-1';
                        const isEditing = editingFieldId === field.id;

                        return (
                            <div
                                key={field.id}
                                className={`${colSpanClass} p-2 ${cellBorderCss} flex flex-col justify-start bg-slate-50/40 relative group/cell hover:bg-indigo-50/20 transition-colors`}
                            >
                                {/* Floating pill controls */}
                                {onUpdateConfig && blockId && (
                                    <div
                                        className="absolute right-1 top-1 z-20 flex items-center gap-0.5 bg-slate-900/90 text-white p-0.5 rounded shadow-sm opacity-0 group-hover/cell:opacity-100 transition-opacity"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => handleMoveField(field.id, 'up')}
                                            className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                                            title="Mover arriba"
                                        >
                                            <ArrowUp className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={idx === activeFields.length - 1}
                                            onClick={() => handleMoveField(field.id, 'down')}
                                            className="p-0.5 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer"
                                            title="Mover abajo"
                                        >
                                            <ArrowDown className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingFieldId(field.id);
                                                setEditingLabelText(field.label);
                                            }}
                                            className="p-0.5 hover:bg-slate-700 rounded cursor-pointer"
                                            title="Renombrar etiqueta"
                                        >
                                            <Pencil className="w-2.5 h-2.5 text-amber-300" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSpan(field.id)}
                                            className={`p-0.5 hover:bg-slate-700 rounded cursor-pointer ${field.colSpan === 2 ? 'text-indigo-300' : 'text-slate-300'}`}
                                            title={field.colSpan === 2 ? "Cambiar a 1 columna" : "Expandir a 2 columnas"}
                                        >
                                            <Columns className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleHideField(field.id)}
                                            className="p-0.5 hover:bg-red-900/80 rounded text-red-300 cursor-pointer"
                                            title="Ocultar campo"
                                        >
                                            <EyeOff className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="flex items-center gap-1 mb-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingLabelText}
                                            onChange={e => setEditingLabelText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateLabel(field.id, editingLabelText)}
                                            autoFocus
                                            className="px-1 py-0.5 text-slate-900 bg-white text-[9px] font-bold rounded border border-indigo-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateLabel(field.id, editingLabelText)}
                                            className="p-0.5 bg-emerald-600 rounded text-white"
                                        >
                                            <Check className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingFieldId(null)}
                                            className="p-0.5 bg-slate-600 rounded text-white"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">
                                        {field.label}
                                    </span>
                                )}

                                {field.fieldType === 'checkbox_group' ? (
                                    <div className="flex items-center gap-4 mt-1">
                                        {(field.options || ['BÁSICA', 'APLICADA', 'EXPERIMENTAL']).map((opt, oIdx) => (
                                            <label key={oIdx} className="flex items-center gap-1.5 text-[10px] text-slate-800 font-medium cursor-pointer">
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

                {/* Botón rápido en el lienzo para añadir campos */}
                {onUpdateConfig && blockId && (
                    <div className="p-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleAddField}
                            className="flex items-center gap-1 text-[8.5px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-2xs transition-all cursor-pointer"
                        >
                            <Plus className="w-2.5 h-2.5" /> Añadir Campo
                        </button>
                        <button
                            type="button"
                            onClick={() => onUpdateConfig(blockId, 'progressHeaderFields', DEFAULT_PROGRESS_HEADER_FIELDS)}
                            className="flex items-center gap-1 text-[8px] text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Restablecer a campos por defecto"
                        >
                            <RotateCcw className="w-2.5 h-2.5" /> Restablecer campos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const RenderProgressActivitySection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
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

    if (variant === 'ejecutadas') {
        return (
            <div className="w-full text-slate-900 font-sans my-2">
                <div className="w-full border border-slate-300 overflow-hidden rounded-xs bg-white">
                    {/* Header del bloque */}
                    <div
                        className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                        style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                    >
                        <span>{getVariantTitle()}</span>
                        <span className="text-[9px] opacity-80 font-normal">
                            Variante: <strong className="uppercase">Ejecutadas (Vertical CACES)</strong>
                        </span>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-left border-collapse border border-slate-400 text-[9pt]">
                            <tbody>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold w-[32%] p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        NÚMERO DE ACTIVIDAD
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [El número de actividad es, en referencia al número de actividades planteadas en la matriz del proyecto aprobado]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        ACTIVIDADES EJECUTADAS
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [De acuerdo a la matriz de actividades presentadas en el proyecto]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        RESULTADOS OBTENIDOS
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir de manera concreta, coherente y fluida lo que obtuvo al realizar la actividad ejecutada o en ejecución]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PORCENTAJE DE AVANCE (%)
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [El porcentaje de avance de la actividad]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PARTICIPANTES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Director del Proyecto e Investigadores]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA DE INICIO DE LA ACTIVIDAD
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA FIN DE LA ACTIVIDAD
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año] [si aún no termina la actividad, colocar las palabras “En ejecución”]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#b8860b] text-slate-900 font-bold p-1.5 border border-amber-600 uppercase text-[8.5pt] align-top">
                                        OBSERVACIONES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8pt] leading-tight align-top bg-amber-50/20">
                                        <p>- De ser necesario, describir algún tipo de particularidad relevante en la ejecución de la actividad.</p>
                                        <p className="mt-1">- Cuando la actividad se encuentra concluida, es decir, con el 100% en el porcentaje de avance, colocar aquí, el número de anexo al que corresponde donde se encuentran los respaldos de su ejecución. Recordando que la numeración de los anexos va igual que el número de actividad asignado en la matriz de actividades presentadas en el proyecto aprobado.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'no_previstas') {
        return (
            <div className="w-full text-slate-900 font-sans my-2">
                <div className="w-full border border-slate-300 overflow-hidden rounded-xs bg-white">
                    <div
                        className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                        style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                    >
                        <span>{getVariantTitle()}</span>
                        <span className="text-[9px] opacity-80 font-normal">
                            Variante: <strong className="uppercase">No Previstas (Vertical CACES)</strong>
                        </span>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-left border-collapse border border-slate-400 text-[9pt]">
                            <tbody>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold w-[35%] p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        NÚMERO DE ACTIVIDAD
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Se numera en orden sucesivo, pero con las letras “NP” al final, es decir: Actividad 1NP, Actividad 2NP, etc.]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        OBJETIVO DEL PROYECTO DE INVESTIGACIÓN
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Colocar el objetivo específico al que se asocia la actividad NO prevista]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        ACTIVIDAD EJECUTADA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir la actividad NO prevista ejecutada o en ejecución]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        RESULTADOS OBTENIDOS
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir de manera concreta, coherente y fluida lo que obtuvo al realizar la actividad ejecutada o en ejecución]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PORCENTAJE DE AVANCE (%)
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [El porcentaje de avance de la actividad NO prevista]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PARTICIPANTES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Director del Proyecto, Investigadores]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA DE INICIO DE LA ACTIVIDAD NO PREVISTA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA FIN DE LA ACTIVIDAD NO PREVISTA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año] [si aún no termina la actividad, colocar las palabras “En ejecución”]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#b8860b] text-slate-900 font-bold p-1.5 border border-amber-600 uppercase text-[8.5pt] align-top">
                                        OBSERVACIONES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8pt] leading-tight align-top bg-amber-50/20">
                                        <p>- De ser necesario, describir algún tipo de particularidad relevante en la ejecución de la actividad.</p>
                                        <p className="mt-1">- Cuando la actividad se encuentra concluida... anexo numerado en orden sucesivo, pero con las letras “NP” al final, es decir: Anexo 1NP, Anexo 2NP, etc.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 text-[8pt] text-slate-600 font-bold text-center space-y-0.5">
                            <p>[En caso de reportar más de 1 actividad NO prevista ejecutada o en ejecución, se debe replicar el cuadro, con la finalidad que cada actividad NO prevista tenga su propio cuadro con su detalle correspondiente]</p>
                            <p>[En caso de no tener que reportar ninguna actividad NO prevista, se debe colocar las siglas “N/A”, en cada casillero del cuadro]</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'obstaculos') {
        return (
            <div className="w-full text-slate-900 font-sans my-2">
                <div className="w-full border border-slate-300 overflow-hidden rounded-xs bg-white">
                    <div
                        className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                        style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
                    >
                        <span>{getVariantTitle()}</span>
                        <span className="text-[9px] opacity-80 font-normal">
                            Variante: <strong className="uppercase">Obstáculos (Vertical CACES)</strong>
                        </span>
                    </div>

                    <div className="p-2">
                        <table className="w-full text-left border-collapse border border-slate-400 text-[9pt]">
                            <tbody>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold w-[35%] p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        NÚMERO DE ACTIVIDAD
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Se numera en orden sucesivo, pero con las letras “OBS” al final, es decir: Actividad 1 OBS, Actividad 2 OBS, etc.]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        OBJETIVO DEL PROYECTO DE INVESTIGACIÓN
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Colocar el objetivo específico al que se asocia el obstáculo o limitación]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        LIMITACIÓN
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir la limitación que se presentó o se mantiene presente que genera inconveniente en la correcta ejecución del proyecto de investigación]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        ACTIVIDAD CORRECTIVA DESARROLLADA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir de manera concreta, coherente y fluida la actividad o actividades correctivas que fueron desarrolladas para solventar la limitación que se presentó]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        RESULTADOS OBTENIDOS
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Describir de manera concreta, coherente y fluida lo que obtuvo al realizar la actividad correctiva ejecutada o en ejecución]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PORCENTAJE DE AVANCE (%)
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [El porcentaje de avance de la actividad correctiva]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        PARTICIPANTES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [Director del Proyecto, Investigadores]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA DE INICIO DE LA ACTIVIDAD CORRECTIVA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#1e293b] text-white font-bold p-1.5 border border-slate-400 uppercase text-[8.5pt]">
                                        FECHA FIN DE LA ACTIVIDAD CORRECTIVA
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8.5pt]">
                                        [día/mes/año] [si aún no termina la actividad, colocar las palabras “En ejecución”]
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-[#b8860b] text-slate-900 font-bold p-1.5 border border-amber-600 uppercase text-[8.5pt] align-top">
                                        OBSERVACIONES
                                    </td>
                                    <td className="p-1.5 border border-slate-300 font-medium text-slate-700 text-[8pt] leading-tight align-top bg-amber-50/20">
                                        <p>- De ser necesario, describir algún tipo de particularidad relevante en la ejecución de la actividad correctiva.</p>
                                        <p className="mt-1">- Cuando la actividad correctiva se encuentra concluida, es decir, con el 100% en el porcentaje de avance, colocar aquí, el número de anexo al que corresponde donde se encuentran los respaldos de su ejecución. El anexo será numerado en orden sucesivo, pero con las letras “OBS” al final, es decir: Anexo 1 OBS, Anexo 2 OBS, etc.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 text-[8pt] text-slate-600 font-bold text-center space-y-0.5">
                            <p>[En caso de reportar más de 1 actividad correctiva ejecutada o en ejecución, se debe replicar el cuadro, con la finalidad que cada actividad correctiva tenga su propio cuadro con su detalle correspondiente]</p>
                            <p>[En caso de no tener que reportar ninguna actividad correctiva, se debe colocar las siglas “N/A”, en cada casillero del cuadro]</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full text-slate-900 font-sans my-2">
            <div className="w-full border border-slate-300 overflow-hidden rounded-xs">
                {/* Header del bloque */}
                <div
                    className="px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between"
                    style={{ backgroundColor: headerPair.bg, color: headerPair.fg }}
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
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const title = c.statusTableTitle || 'ESTADO DE EJECUCIÓN DEL PROYECTO';
    const options = c.statusOptions || ['INICIADO', 'EN AVANCE', 'SUSPENDIDO', 'POR FINALIZAR', 'FINALIZADO'];

    return (
        <div className="w-full text-slate-900 font-sans my-2 select-none">
            <div className="w-full border border-slate-300 overflow-hidden rounded-xs bg-white p-4 space-y-4">
                {onUpdateConfig && blockId ? (
                    <input
                        type="text"
                        value={title}
                        onChange={e => onUpdateConfig(blockId, 'statusTableTitle', e.target.value)}
                        className="font-bold text-[11pt] uppercase tracking-wider text-center text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5 w-full"
                    />
                ) : (
                    <p className="font-bold text-[11pt] uppercase tracking-wider text-center text-slate-900">{title}</p>
                )}
                <p className="text-[8.5pt] font-semibold text-slate-900 uppercase">MARQUE CON UNA (X) EL ESTADO ACTUAL DEL PROYECTO DE INVESTIGACIÓN:</p>
                
                <table className="w-full text-center border-collapse border border-slate-900 text-[8.5pt]">
                    <thead>
                        <tr className="bg-[#222c57] text-white font-bold">
                            {options.map((opt: string) => (
                                <th key={opt} className="p-1.5 border border-slate-900 w-[20%] uppercase text-[8.5pt]">{opt}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {options.map((opt: string) => (
                                <td key={opt} className="p-2 border border-slate-900 font-black text-[10pt] text-slate-900">
                                    {opt === 'EN AVANCE' ? '(X)' : ''}
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-[#222c57] text-white font-bold text-left">
                            <td colSpan={5} className="p-1.5 border border-slate-900 text-[8.5pt] uppercase">
                                EXPLIQUE BREVEMENTE LA FASE DE EJECUCIÓN EN QUE SE ENCUENTRA SU PROYECTO:
                            </td>
                        </tr>
                        <tr className="text-left">
                            <td colSpan={5} className="p-2 border border-slate-900 min-h-[50px] text-[8pt] text-slate-600 font-medium italic bg-white">
                                [Describir de 3 a 6 líneas, de manera coherente, fluida y concreta, el estado actual del proyecto de investigación en donde se mencione las actividades realizadas, resultados obtenidos y objetivos del proyecto de investigación relacionados]
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="space-y-1 pt-1">
                    <p className="font-bold text-[8.5pt] text-slate-900 uppercase">OBSERVACIONES GENERALES DEL DIRECTOR DEL PROYECTO:</p>
                    <div className="border border-slate-900 p-2 min-h-[50px] text-[8pt] text-slate-600 font-medium italic bg-white">
                        [Redactar el punto de vista del Director del Proyecto de manera general de la ejecución del proyecto hasta la entrega de la presente Ficha de Seguimiento, en un párrafo de 4 a 6 líneas]
                    </div>
                </div>

                <div className="space-y-1 pt-1">
                    <p className="font-bold text-[8.5pt] text-slate-900 uppercase">OBSERVACIONES GENERALES DEL COORDINADOR DE LA UNIDAD DE INVESTIGACIÓN:</p>
                    <div className="border border-slate-900 p-2 min-h-[40px] text-[8pt] text-slate-600 font-medium italic bg-white">
                        [Esta parte es redactada por la coordinación del Departamento de Investigación e Innovación]
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RenderFinalReportHeaderSection: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const c = config || {};
    const title = c.finalReportTitle || 'DATOS DEL PROYECTO DE INVESTIGACIÓN';
    const headerColorKey = c.finalReportHeaderColor || 'navy';
    const headerBg = headerColorKey === 'gold' ? '#c4a857' : headerColorKey === 'slate' ? '#334155' : '#222c57';

    const handleToggle = (key: string, currentVal: boolean = true) => {
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, key, !currentVal);
    };

    return (
        <div className="w-full text-slate-900 font-sans my-2 select-none">
            {/* Barra de chips en lienzo para activar/desactivar sub-secciones */}
            {onUpdateConfig && blockId && (
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-indigo-50/60 border border-indigo-100 rounded-md mb-2 text-[8.5px]">
                    <span className="font-bold text-indigo-900 uppercase tracking-wider shrink-0 mr-1">Secciones:</span>
                    {[
                        { key: 'showTipoInvestigacion', label: 'Tipo Invest.', active: c.showTipoInvestigacion !== false },
                        { key: 'showAlcanceProyecto', label: 'Alcance Proyecto', active: c.showAlcanceProyecto !== false },
                        { key: 'showFechasProyecto', label: 'Fechas Proyecto', active: c.showFechasProyecto !== false },
                        { key: 'showTablaInvestigadores', label: 'Investigadores', active: c.showTablaInvestigadores !== false },
                    ].map(({ key, label, active }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggle(key, active); }}
                            className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer font-medium ${active
                                ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 line-through'
                            }`}
                        >
                            {active ? '✓ ' : '+ '}{label}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full border border-black overflow-hidden rounded-xs bg-white p-2">
                <table className="w-full border-collapse border border-black text-[8.5pt]">
                    <tbody>
                        <tr className="text-center font-bold uppercase bg-white">
                            <td colSpan={6} className="p-1.5 border border-black text-[9pt] font-extrabold text-black">
                                {onUpdateConfig && blockId ? (
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => onUpdateConfig(blockId, 'finalReportTitle', e.target.value)}
                                        className="font-extrabold text-[9pt] uppercase tracking-wider text-center text-black bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5 w-full"
                                    />
                                ) : (
                                    title
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase w-[30%] text-black">NOMBRE DEL PROYECTO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic font-medium" colSpan={5}>[TÍTULO DEL PROYECTO]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">PROGRAMA:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[NOMBRE DEL PROGRAMA]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">GRUPO DE INVESTIGACIÓN:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[GRUPO DE INVESTIGACIÓN]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">DOMINIO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[DOMINIO INSTITUCIONAL]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">LÍNEA DE INVESTIGACIÓN:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[LÍNEA PRINCIPAL]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">SUBLÍNEA DE INVESTIGACIÓN:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[SUBLÍNEA ESPECÍFICA]</td>
                        </tr>
                        {c.showTipoInvestigacion !== false && (
                            <tr>
                                <td className="p-1.5 border border-black font-bold uppercase text-black">TIPO DE INVESTIGACIÓN (X):</td>
                                <td className="p-0 border border-black" colSpan={5}>
                                    <div className="flex items-center text-[8pt] text-black">
                                        <div className="w-[20%] p-1 border-r border-black font-bold text-center">BÁSICA</div>
                                        <div className="w-[13%] p-1 border-r border-black text-center">( &nbsp; )</div>
                                        <div className="w-[20%] p-1 border-r border-black font-bold text-center">APLICADA</div>
                                        <div className="w-[13%] p-1 border-r border-black text-center font-bold">( X )</div>
                                        <div className="w-[24%] p-1 border-r border-black font-bold text-center">DESARROLLO EXPERIMENTAL</div>
                                        <div className="w-[10%] p-1 text-center">( &nbsp; )</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">CAMPO AMPLIO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[CAMPO AMPLIO CACES]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">CAMPO ESPECÍFICO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[CAMPO ESPECÍFICO CACES]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">CAMPO DETALLADO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[CAMPO DETALLADO CACES]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">CARRERA:</td>
                            <td className="p-1.5 border border-black text-slate-700 font-medium" colSpan={5}>Tecnología Superior en [CARRERA]</td>
                        </tr>
                        <tr>
                            <td className="p-1.5 border border-black font-bold uppercase text-black">PERIODO ACADÉMICO:</td>
                            <td className="p-1.5 border border-black text-slate-700 italic" colSpan={5}>[PERIODO ACADÉMICO]</td>
                        </tr>

                        {c.showAlcanceProyecto !== false && (
                            <>
                                <tr className="text-center font-bold uppercase text-black bg-white">
                                    <td colSpan={6} className="p-1.5 border border-black text-[8.5pt]">ALCANCE DEL PROYECTO (X)</td>
                                </tr>
                                <tr className="text-center text-[7.5pt] font-bold uppercase text-black">
                                    <td className="p-1 border border-black w-[20%]">INSTITUCIONAL</td>
                                    <td className="p-1 border border-black w-[20%]">PARROQUIAL</td>
                                    <td className="p-1 border border-black w-[20%]">CANTONAL</td>
                                    <td className="p-1 border border-black w-[20%]">PROVINCIAL</td>
                                    <td className="p-1 border border-black w-[20%]" colSpan={2}>NACIONAL</td>
                                </tr>
                                <tr className="text-center font-bold text-[9pt] text-black">
                                    <td className="p-1 border border-black">( X )</td>
                                    <td className="p-1 border border-black">( &nbsp; )</td>
                                    <td className="p-1 border border-black">( &nbsp; )</td>
                                    <td className="p-1 border border-black">( &nbsp; )</td>
                                    <td className="p-1 border border-black" colSpan={2}>( &nbsp; )</td>
                                </tr>
                            </>
                        )}

                        {c.showFechasProyecto !== false && (
                            <>
                                <tr className="text-center font-bold uppercase text-[7.5pt] text-black">
                                    <td className="p-1 border border-black" colSpan={1}>FECHA DE PRESENTACIÓN DEL PROYECTO</td>
                                    <td className="p-1 border border-black" colSpan={2}>FECHA DE INICIO DEL PROYECTO</td>
                                    <td className="p-1 border border-black" colSpan={1}>FECHA FIN PRESENTADA DEL PROYECTO</td>
                                    <td className="p-1 border border-black" colSpan={2}>FECHA FIN REAL</td>
                                </tr>
                                <tr className="text-center text-[8pt] text-slate-700">
                                    <td className="p-1 border border-black" colSpan={1}>[DD/MM/AAAA]</td>
                                    <td className="p-1 border border-black" colSpan={2}>[DD/MM/AAAA]</td>
                                    <td className="p-1 border border-black" colSpan={1}>[DD/MM/AAAA]</td>
                                    <td className="p-1 border border-black" colSpan={2}>[DD/MM/AAAA]</td>
                                </tr>
                            </>
                        )}

                        {c.showTablaInvestigadores !== false && (
                            <>
                                <tr className="text-center font-bold uppercase text-black bg-white">
                                    <td colSpan={6} className="p-1.5 border border-black text-[8.5pt]">INVESTIGADORES</td>
                                </tr>
                                <tr className="text-center text-[7.5pt] font-bold uppercase text-black">
                                    <td className="p-1 border border-black w-[25%]">NOMBRE</td>
                                    <td className="p-1 border border-black w-[20%]">NÚMERO DE CÉDULA</td>
                                    <td className="p-1 border border-black w-[20%]">EMAIL</td>
                                    <td className="p-1 border border-black w-[15%]">TELÉFONO</td>
                                    <td className="p-1 border border-black w-[20%]" colSpan={2}>ROL DENTRO DE LA INSTITUCIÓN</td>
                                </tr>
                                <tr className="text-center text-[8pt]">
                                    <td className="p-1 border border-black text-left font-medium text-black">[NOMBRE DEL DIRECTOR]</td>
                                    <td className="p-1 border border-black">[CÉDULA]</td>
                                    <td className="p-1 border border-black">[EMAIL]</td>
                                    <td className="p-1 border border-black">[TELÉFONO]</td>
                                    <td className="p-1 border border-black font-bold text-black" colSpan={2}>DIRECTOR DE PROYECTO</td>
                                </tr>
                                <tr className="text-center text-[8pt]">
                                    <td className="p-1 border border-black text-left font-medium text-black">[INVESTIGADOR DOCENTE 1]</td>
                                    <td className="p-1 border border-black">[CÉDULA]</td>
                                    <td className="p-1 border border-black">[EMAIL]</td>
                                    <td className="p-1 border border-black">[TELÉFONO]</td>
                                    <td className="p-1 border border-black text-slate-700" colSpan={2}>INVESTIGADOR DOCENTE</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


