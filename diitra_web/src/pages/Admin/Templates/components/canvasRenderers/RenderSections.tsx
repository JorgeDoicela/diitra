import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Scissors } from 'lucide-react';
import type { ImpactCategory } from '../../types';
import { DEFAULT_TECHNICAL_SUBSECTIONS, DEFAULT_IMPACT_CATEGORIES, DEFAULT_FINAL_REPORT_WRITING_SUBSECTIONS } from '../../types';
import { getNormalizedColumns, getNormalizedCategories } from '../properties/ExpectedProductsProperties';

export const RenderProjectGeneralSection: React.FC<{
    config?: any;
    title?: string;
    blockId?: string;
    onUpdateConfig?: (blockId: string, key: string, value: any) => void;
}> = ({ config, title }) => {
    const displayTitle = config?.title || title || '1.  IDENTIFICACIÓN DEL PROYECTO';
    return (
        <div className="my-2 select-none font-sans">
            <p className="font-bold text-[10pt] uppercase text-[#1e2a4a] mb-2 tracking-wide font-sans">
                {displayTitle}
            </p>
            <table className="w-full border-collapse border border-black text-[9px] table-fixed">
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
                    {/* 1. NOMBRE DEL PROYECTO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            NOMBRE DEL PROYECTO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 font-semibold bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 2. PROGRAMA */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            PROGRAMA:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 3. GRUPO DE INVESTIGACIÓN */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            GRUPO DE INVESTIGACIÓN:
                        </td>
                        <td className="font-bold text-[8px] text-center border-r border-black p-1.5 align-middle">
                            NO
                        </td>
                        <td className="text-center border-r border-black p-1.5 text-[8.5px] align-middle">
                            &nbsp;
                        </td>
                        <td className="font-bold text-[8px] text-center border-r border-black p-1.5 align-middle">
                            SI
                        </td>
                        <td colSpan={3} className="p-1.5 text-slate-400 italic text-[8.5px] align-middle">
                            [Escriba el Nombre o borrar este título]
                        </td>
                    </tr>
                    {/* 4. DOMINIO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            DOMINIO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 5. LÍNEA DE INVESTIGACIÓN */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            LÍNEA DE INVESTIGACIÓN:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 6. SUBLÍNEA DE INVESTIGACIÓN */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            SUBLÍNEA DE INVESTIGACIÓN:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 7. TIPO DE INVESTIGACIÓN (X) */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            TIPO DE INVESTIGACIÓN (X):
                        </td>
                        <td className="font-bold text-[7.5px] text-center border-r border-black p-1.5 align-middle">
                            BÁSICA
                        </td>
                        <td className="text-center border-r border-black p-1.5 text-[8.5px] align-middle">
                            &nbsp;
                        </td>
                        <td className="font-bold text-[7.5px] text-center border-r border-black p-1.5 align-middle">
                            APLICADA
                        </td>
                        <td className="text-center border-r border-black p-1.5 text-[8.5px] align-middle">
                            &nbsp;
                        </td>
                        <td className="font-bold text-[7px] text-center border-r border-black p-1.5 align-middle">
                            DESARROLLO EXPERIMENTAL
                        </td>
                        <td className="text-center p-1.5 text-[8.5px] align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 8. CAMPO AMPLIO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            CAMPO AMPLIO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 9. CAMPO ESPECÍFICO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            CAMPO ESPECÍFICO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 10. CAMPO DETALLADO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            CAMPO DETALLADO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 11. CARRERA */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            CARRERA:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            Tecnología Superior en
                        </td>
                    </tr>
                    {/* 12. PERIODO ACADÉMICO DE CONVOCATORIA */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            PERIODO ACADÉMICO DE CONVOCATORIA:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 13. TIEMPO DE EJECUCIÓN */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            TIEMPO DE EJECUCIÓN:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-800 bg-white align-middle">
                            &nbsp;
                        </td>
                    </tr>
                    {/* 14. DIRECTOR DEL PROYECTO */}
                    <tr className="border-b border-black">
                        <td className="bg-[#1e2a4a] text-white p-2 font-bold text-[8.5px] uppercase border-r border-black align-middle">
                            DIRECTOR DEL PROYECTO:
                        </td>
                        <td colSpan={6} className="p-2 text-slate-500 italic bg-white align-middle">
                            [Título abreviado, Apellidos y Nombres Completos]
                        </td>
                    </tr>
                    {/* 15. BANNER DORADO DE FECHAS */}
                    <tr className="border-b border-black">
                        <td className="bg-[#c4a857] text-black p-1.5 font-bold text-[7.5px] text-center border-r border-black align-middle">
                            FECHA DE PRESENTACIÓN DEL PROYECTO
                        </td>
                        <td colSpan={3} className="bg-[#c4a857] text-black p-1.5 font-bold text-[7.5px] text-center border-r border-black align-middle">
                            FECHA PREVISTA DE INICIO DEL PROYECTO
                        </td>
                        <td colSpan={3} className="bg-[#c4a857] text-black p-1.5 font-bold text-[7.5px] text-center align-middle">
                            FECHA PREVISTA DE FINALIZACIÓN DEL PROYECTO
                        </td>
                    </tr>
                    <tr className="border-b border-black text-[8px] text-slate-500 italic bg-white text-center">
                        <td className="p-1.5 border-r border-black align-middle">
                            [día/mes/año]
                        </td>
                        <td colSpan={3} className="p-1.5 border-r border-black align-middle">
                            [día/mes/año]
                        </td>
                        <td colSpan={3} className="p-1.5 align-middle">
                            [día/mes/año]
                        </td>
                    </tr>
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
}> = ({ config }) => {
    const c = config || {};

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
