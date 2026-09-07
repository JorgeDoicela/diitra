import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Check, EyeOff, Edit2, Plus } from 'lucide-react';

export const RenderProjectBudgetSection: React.FC<{
    config?: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title, blockId, onUpdateConfig }) => {
    const c = config || {};
    const displayTitle = c.title || title || '4.  RECURSOS, COSTO Y FINANCIAMIENTO';
    const defaultHeaderColorKey = c.budgetHeaderColor || '#222c57';
    const borderStyleKey = c.budgetBorderStyle || 'solid';
    const borderColorKey = c.budgetBorderColor || '#000000';
    const borderWidthKey = c.budgetBorderWidth !== undefined ? c.budgetBorderWidth : 1;

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    const resolveHeaderBg = (col?: string) => {
        const target = col || defaultHeaderColorKey;
        if (target && (target.startsWith('#') || target.startsWith('rgb') || target.startsWith('hsl'))) return target;
        switch (target) {
            case 'gold': return '#c4a857';
            case 'slate': return '#334155';
            case 'emerald': return '#065f46';
            case 'navy':
            default: return '#222c57';
        }
    };

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

    const defaultOrder = ['disponibles', 'necesarios', 'financiamiento'];
    const currentOrder: string[] = Array.isArray(c.budgetTablesOrder) && c.budgetTablesOrder.length > 0
        ? c.budgetTablesOrder
        : defaultOrder;

    const fullOrder = [...currentOrder];
    defaultOrder.forEach(k => {
        if (!fullOrder.includes(k)) fullOrder.push(k);
    });

    const handleMoveTable = (tableId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const idx = fullOrder.indexOf(tableId);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= fullOrder.length) return;
        const updated = [...fullOrder];
        const [moved] = updated.splice(idx, 1);
        updated.splice(targetIdx, 0, moved);
        onUpdateConfig(blockId, 'budgetTablesOrder', updated);
    };

    const variants = ['navy', 'gold', 'slate', 'emerald'];
    const handleCycleVariant = (variantKey: string, currentVal: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        const currentIdx = variants.indexOf(currentVal || 'navy');
        const next = variants[(currentIdx + 1) % variants.length];
        onUpdateConfig(blockId, variantKey, next);
    };

    const handleToggleTable = (toggleKey: string, value: boolean, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!onUpdateConfig || !blockId) return;
        onUpdateConfig(blockId, toggleKey, value);
    };

    const handleSaveText = (targetKey: string, isColLabel = false) => {
        if (!onUpdateConfig || !blockId) return;
        if (isColLabel) {
            const currentLabels = { ...(c.colLabels || {}) };
            currentLabels[targetKey] = editingText;
            onUpdateConfig(blockId, 'colLabels', currentLabels);
        } else {
            onUpdateConfig(blockId, targetKey, editingText);
        }
        setEditingKey(null);
    };

    const colLabels = c.colLabels || {};

    const renderDirectControlsPill = (
        tableId: string,
        variantKey: string,
        currentVariant: string,
        toggleKey: string,
        isFirst: boolean,
        isLast: boolean
    ) => (
        <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/table:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-[8px] absolute top-1 right-1 z-20 font-sans"
        >
            <button
                type="button"
                onClick={(e) => handleMoveTable(tableId, 'up', e)}
                disabled={isFirst}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover tabla arriba"
            >
                <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
                type="button"
                onClick={(e) => handleMoveTable(tableId, 'down', e)}
                disabled={isLast}
                className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-20 cursor-pointer transition-colors"
                title="Mover tabla abajo"
            >
                <ArrowDown className="w-2.5 h-2.5" />
            </button>
            <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
            <span className="text-[7.5px] uppercase font-bold text-slate-400">Color:</span>
            <button
                type="button"
                onClick={(e) => handleCycleVariant(variantKey, currentVariant, e)}
                className={`px-1.5 py-0.2 text-[8px] font-bold rounded border transition-all cursor-pointer ${
                    currentVariant === 'gold'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : currentVariant === 'slate'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : currentVariant === 'emerald'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
                title="Cambiar color de cabecera"
            >
                {currentVariant === 'gold' ? 'Dorado' : currentVariant === 'slate' ? 'Pizarra' : currentVariant === 'emerald' ? 'Verde' : 'Azul'}
            </button>
            <span className="w-px h-2.5 bg-slate-200 dark:bg-slate-700 my-auto" />
            <button
                type="button"
                onClick={(e) => handleToggleTable(toggleKey, false, e)}
                className="p-0.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                title="Ocultar esta tabla del documento"
            >
                <EyeOff className="w-2.5 h-2.5" />
            </button>
        </div>
    );

    const renderEditableCell = (
        configKey: string,
        defaultText: string,
        isColLabel = false,
        extraCls = ''
    ) => {
        const text = isColLabel ? (colLabels[configKey] || defaultText) : (c[configKey] || defaultText);
        if (editingKey === configKey) {
            return (
                <div className="inline-flex items-center justify-center gap-1 select-text" onClick={e => e.stopPropagation()}>
                    <input
                        type="text"
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveText(configKey, isColLabel);
                            if (e.key === 'Escape') setEditingKey(null);
                        }}
                        autoFocus
                        className="bg-white text-slate-900 px-1 py-0.5 text-[8.5px] rounded outline-none font-bold text-center border border-indigo-400 w-auto min-w-[70px]"
                    />
                    <button
                        type="button"
                        onClick={() => handleSaveText(configKey, isColLabel)}
                        className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
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
                    setEditingKey(configKey);
                    setEditingText(text);
                }}
                className={`cursor-pointer hover:underline decoration-dotted transition-colors group-hover/th:text-indigo-200 inline-flex items-center justify-center gap-1 ${extraCls}`}
                title="Clic para editar texto en el lienzo"
            >
                {text}
                <Edit2 className="w-2 h-2 opacity-0 group-hover/table:opacity-40 transition-opacity" />
            </span>
        );
    };

    const renderTable = (type: string, isFirst: boolean, isLast: boolean) => {
        if (type === 'disponibles') {
            if (c.showRecursosDisponibles === false) return null;
            const currentVariant = c.variantRecursosDisponibles || 'navy';
            const headerBg = resolveHeaderBg(currentVariant);

            return (
                <div key="disponibles" className="overflow-hidden relative group/table" style={borderFullStyle}>
                    {renderDirectControlsPill('disponibles', 'variantRecursosDisponibles', currentVariant, 'showRecursosDisponibles', isFirst, isLast)}
                    <table className="w-full text-[8.5px] border-collapse" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <thead>
                            <tr style={borderBottomStyle}>
                                <th
                                    colSpan={3}
                                    className="p-1.5 text-center font-bold uppercase text-[9px] tracking-wider group/th"
                                    style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}
                                >
                                    {renderEditableCell('titleRecursosDisponibles', 'RECURSOS DISPONIBLES')}
                                </th>
                            </tr>
                            <tr style={borderBottomStyle}>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_disp_desc', 'DESCRIPCIÓN', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/3 group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_disp_cant', 'CANTIDAD', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/3 group/th" style={borderBottomStyle}>
                                    {renderEditableCell('col_disp_fuente', 'FUENTE', true)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={borderBottomStyle}>
                                <td className="p-2 text-slate-700 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white">&nbsp;</td>
                            </tr>
                            <tr>
                                <td className="p-2 text-slate-700 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        }

        if (type === 'necesarios') {
            if (c.showRecursosNecesarios === false) return null;
            const currentVariant = c.variantRecursosNecesarios || 'navy';
            const headerBg = resolveHeaderBg(currentVariant);

            return (
                <div key="necesarios" className="overflow-hidden relative group/table" style={borderFullStyle}>
                    {renderDirectControlsPill('necesarios', 'variantRecursosNecesarios', currentVariant, 'showRecursosNecesarios', isFirst, isLast)}
                    <table className="w-full text-[8.5px] border-collapse" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <thead>
                            <tr style={borderBottomStyle}>
                                <th
                                    colSpan={4}
                                    className="p-1.5 text-center font-bold uppercase text-[9px] tracking-wider group/th"
                                    style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}
                                >
                                    {renderEditableCell('titleRecursosNecesarios', 'RECURSOS NECESARIOS')}
                                </th>
                            </tr>
                            <tr style={borderBottomStyle}>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_nec_desc', 'DESCRIPCIÓN', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/4 group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_nec_cant', 'CANTIDAD', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/4 group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_nec_unit', 'COSTO UNITARIO', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/4 group/th" style={borderBottomStyle}>
                                    {renderEditableCell('col_nec_tot', 'COSTO TOTAL', true)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={borderBottomStyle}>
                                <td className="p-2 text-slate-700 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-right" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-right">&nbsp;</td>
                            </tr>
                            <tr style={borderBottomStyle}>
                                <td className="p-2 text-slate-700 bg-white" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-right" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-right">&nbsp;</td>
                            </tr>
                            <tr>
                                <td
                                    colSpan={3}
                                    className="p-1.5 text-center font-bold uppercase text-[8.5px] group/th"
                                    style={{ backgroundColor: '#c4a857', color: '#000000', ...borderRightStyle }}
                                >
                                    {renderEditableCell('titleCostoTotal', 'COSTO TOTAL DEL PROYECTO')}
                                </td>
                                <td className="p-1.5 text-right font-bold text-slate-900 text-[8.5px] bg-white">
                                    $ 0.00
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        }

        if (type === 'financiamiento') {
            if (c.showFinanciamiento === false) return null;
            const currentVariant = c.variantFinanciamiento || 'navy';
            const headerBg = resolveHeaderBg(currentVariant);

            return (
                <div key="financiamiento" className="overflow-hidden relative group/table" style={borderFullStyle}>
                    {renderDirectControlsPill('financiamiento', 'variantFinanciamiento', currentVariant, 'showFinanciamiento', isFirst, isLast)}
                    <table className="w-full text-[8.5px] border-collapse" style={{ borderCollapse: 'collapse', ...borderFullStyle }}>
                        <thead>
                            <tr style={borderBottomStyle}>
                                <th
                                    colSpan={3}
                                    className="p-1.5 text-center font-bold uppercase text-[9px] tracking-wider group/th"
                                    style={{ backgroundColor: headerBg, color: '#ffffff', ...borderBottomStyle }}
                                >
                                    {renderEditableCell('titleFinanciamiento', 'FINANCIAMIENTO (X)')}
                                </th>
                            </tr>
                            <tr style={borderBottomStyle}>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/3 group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_fin_istpet', 'ISTPET', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/3 group/th" style={{ ...borderRightStyle, ...borderBottomStyle }}>
                                    {renderEditableCell('col_fin_otras', 'OTRAS FUENTES', true)}
                                </th>
                                <th className="p-1.5 text-center font-bold uppercase text-[8.5px] w-1/3 group/th" style={borderBottomStyle}>
                                    {renderEditableCell('col_fin_nombres', 'NOMBRES DE OTRAS FUENTES', true)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 text-slate-700 bg-white text-center font-bold text-[9px]" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center font-bold text-[9px]" style={borderRightStyle}>&nbsp;</td>
                                <td className="p-2 text-slate-700 bg-white text-center text-[8.5px]">&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        }

        return null;
    };

    const activeTables = fullOrder.filter(t => {
        if (t === 'disponibles') return c.showRecursosDisponibles !== false;
        if (t === 'necesarios') return c.showRecursosNecesarios !== false;
        if (t === 'financiamiento') return c.showFinanciamiento !== false;
        return false;
    });

    const hiddenTables = [
        { id: 'disponibles', label: 'Recursos Disponibles', key: 'showRecursosDisponibles', isHidden: c.showRecursosDisponibles === false },
        { id: 'necesarios', label: 'Recursos Necesarios', key: 'showRecursosNecesarios', isHidden: c.showRecursosNecesarios === false },
        { id: 'financiamiento', label: 'Financiamiento (X)', key: 'showFinanciamiento', isHidden: c.showFinanciamiento === false },
    ].filter(t => t.isHidden);

    return (
        <div className="my-3 space-y-4 select-none">
            {displayTitle && (
                <div className="mb-1 ml-7 sm:ml-8">
                    <p className="font-bold text-[10pt] uppercase tracking-wide font-sans" style={{ color: defaultHeaderColorKey }}>
                        {displayTitle}
                    </p>
                </div>
            )}
            {fullOrder.map((t, idx) => {
                const activeIdx = activeTables.indexOf(t);
                const isFirst = activeIdx === 0;
                const isLast = activeIdx === activeTables.length - 1;
                return renderTable(t, isFirst, isLast);
            })}

            {hiddenTables.length > 0 && (
                <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded text-[8px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">Tablas ocultas:</span>
                    {hiddenTables.map(h => (
                        <button
                            key={h.id}
                            type="button"
                            onClick={(e) => handleToggleTable(h.key, true, e)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
                            title="Volver a mostrar esta tabla en el documento"
                        >
                            <Plus className="w-2 h-2 text-emerald-500" />
                            <span>{h.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const RenderProjectProgressReport: React.FC<{ config: any }> = ({ config }) => {
    const c = config || {};
    return (
        <div className="my-2 space-y-3 select-none">
            {c.showEvidencias !== false && (
                <div className="p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1 text-[8.5px]">
                    <strong className="text-slate-700 block font-bold">Bitácora Científica & Conclusiones Parciales:</strong>
                    <p className="text-slate-500 italic">[Redacción de bitácora y conclusiones acumuladas por investigadores...]</p>
                </div>
            )}

            {c.showHitosCompletados !== false && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-1.5 bg-slate-800 text-white font-bold text-[8.5px] uppercase tracking-wider">
                        Hitos & Entregables Completados
                    </div>
                    <table className="w-full text-[8.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-1 text-left">Actividad / Hito</th>
                                <th className="p-1 text-center w-16">% Avance</th>
                                <th className="p-1 text-center w-20">Completado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100 text-slate-600">
                                <td className="p-1">[Hito de Investigación]</td>
                                <td className="p-1 text-center font-bold">100 %</td>
                                <td className="p-1 text-center font-bold text-emerald-600">SÍ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export const RenderProjectApprovalNotice: React.FC<{
    config: any;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, blockId, onUpdateConfig }) => {
    const ciudad = config?.ciudad_emision || "Quito";
    const parrafoAprobacion = config?.parrafo_aprobacion ?? 'Reciba un cordial saludo y por medio del presente, es un placer informarle que, tras la evaluación correspondiente, su proyecto de investigación titulado "[Título del Proyecto de Investigación]" ha sido aprobado por la Coordinación de la Unidad de Investigación.';
    const parrafoFundamento = config?.parrafo_fundamento ?? 'La aprobación se basa en la relevancia y viabilidad del proyecto, así como en su alineación con los objetivos académicos de nuestra institución, quedando establecidos la siguiente información:';
    const textoCaces = config?.textoCACES ?? "Las actividades complementarias al desarrollo del proyecto son los Informes de Seguimiento mensuales, con sus respectivos anexos que respalden las actividades ejecutadas, además de, el Plan de Aprendizaje y Evaluación del Plan de Aprendizaje por cada estudiante que forme parte del grupo de investigación y culminando con la Difusión de Resultados obtenidos del proyecto ejecutado.";
    const parrafoInvitacion = config?.parrafo_invitacion ?? 'Le animamos a proceder con la ejecución del proyecto, manteniendo los estándares de calidad y ética que nos caracterizan.';
    const fraseCierre = config?.frase_cierre || 'Con sentimientos de distinguida consideración.';
    const fraseDespedida = config?.frase_despedida || 'Atentamente,';
    const coordinador = config?.coordinador_nombre || "Ing. Estefani Sánchez Mgtr.";
    const cargo = config?.coordinador_cargo || "Coordinadora de la Unidad de Investigación e Innovación";
    const institucion = config?.firmante_institucion || "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI";
    const mostrarCompromisos = config?.mostrarCompromisosCACES !== false;
    const mostrarFechas = config?.mostrarTablaFechas !== false;
    const mostrarLogoHeader = config?.mostrarLogoHeader === true;

    const handleUpdate = (key: string, val: any) => {
        if (blockId && onUpdateConfig) {
            onUpdateConfig(blockId, key, val);
        }
    };

    return (
        <div className="my-2 space-y-3 select-none">
            {mostrarLogoHeader && (
                <div className="text-left text-[8px] text-slate-400 font-mono italic">
                    [Encabezado con Logo ISTPET Activado]
                </div>
            )}

            <div className="text-[8.5px] text-slate-600 space-y-2 leading-relaxed">
                <div>
                    <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 1 (Saludo y Notificación):</label>
                    <textarea
                        rows={2}
                        className="w-full p-1.5 text-[8.5px] text-slate-700 italic bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={parrafoAprobacion}
                        onChange={(e) => handleUpdate('parrafo_aprobacion', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 2 (Fundamento):</label>
                    <textarea
                        rows={2}
                        className="w-full p-1.5 text-[8.5px] text-slate-600 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={parrafoFundamento}
                        onChange={(e) => handleUpdate('parrafo_fundamento', e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-[8.5px]">
                <table className="w-full border-collapse">
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 w-1/3 text-slate-700">NOMBRE DEL PROYECTO:</td>
                            <td className="p-1.5 text-slate-600 font-semibold">[Nombre Oficial del Proyecto]</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 text-slate-700">LÍNEA DE INVESTIGACIÓN:</td>
                            <td className="p-1.5 text-slate-600">[Línea de Investigación Vinculada]</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="p-1.5 font-bold bg-slate-50 text-slate-700">MESES DE EJECUCIÓN:</td>
                            <td className="p-1.5 text-slate-600">12 meses</td>
                        </tr>
                        {mostrarFechas && (
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <td colSpan={2} className="p-1 text-center font-bold text-slate-700">
                                    [Fechas de Presentación, Inicio y Finalización]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {mostrarCompromisos && (
                <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-[8.5px] text-slate-600 space-y-1">
                    <strong className="block text-slate-700 font-bold">Indicaciones y Compromisos Normativos CACES:</strong>
                    <textarea
                        rows={3}
                        className="w-full p-1.5 text-[8.5px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                        value={textoCaces}
                        onChange={(e) => handleUpdate('textoCACES', e.target.value)}
                    />
                </div>
            )}

            <div>
                <label className="block text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Párrafo 4 (Invitación):</label>
                <textarea
                    rows={2}
                    className="w-full p-1.5 text-[8.5px] text-slate-600 italic bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all focus:outline-none resize-y"
                    value={parrafoInvitacion}
                    onChange={(e) => handleUpdate('parrafo_invitacion', e.target.value)}
                />
            </div>

            <div className="pt-2 border-t border-slate-100 text-[8px] text-slate-500 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] text-slate-500 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={fraseCierre}
                        onChange={(e) => handleUpdate('frase_cierre', e.target.value)}
                        placeholder="Frase de cierre..."
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={fraseDespedida}
                        onChange={(e) => handleUpdate('frase_despedida', e.target.value)}
                        placeholder="Atentamente,"
                    />
                </div>

                <div className="space-y-1 pt-1">
                    <input
                        type="text"
                        className="w-full p-1 text-[8.5px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={coordinador}
                        onChange={(e) => handleUpdate('coordinador_nombre', e.target.value)}
                        placeholder="Nombre del Coordinador/a"
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[8px] text-slate-600 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={cargo}
                        onChange={(e) => handleUpdate('coordinador_cargo', e.target.value)}
                        placeholder="Cargo"
                    />
                    <input
                        type="text"
                        className="w-full p-1 text-[7.5px] font-bold text-slate-700 uppercase bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-emerald-500 focus:outline-none"
                        value={institucion}
                        onChange={(e) => handleUpdate('firmante_institucion', e.target.value)}
                        placeholder="Institución"
                    />
                </div>
            </div>
        </div>
    );
};
