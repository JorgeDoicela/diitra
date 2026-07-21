import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { DocumentBlock, GanttActivity, GanttObjective, GanttColor } from '../../types';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const MONTHS_DEFAULT = [
    'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
    'Sept', 'Octubre', 'Nov', 'Dic', 'Enero', 'Febrero'
];

const GANTT_COLORS: { hex: GanttColor; label: string }[] = [
    { hex: '#1e2a4a', label: 'Azul'    },
    { hex: '#b8912e', label: 'Dorado'  },
    { hex: '#60a5fa', label: 'Celeste' },
    { hex: '#f97316', label: 'Naranja' },
    { hex: '#a855f7', label: 'Violeta' },
    { hex: '#10b981', label: 'Verde'   },
    { hex: '#ef4444', label: 'Rojo'    },
    { hex: '#64748b', label: 'Gris'    },
];

const newActivity = (months: number): GanttActivity => ({
    id: `act-${Date.now()}-${Math.random()}`,
    name: 'Nueva Actividad',
    resources: '',
    startMonth: 0,
    startWeek: 0,
    endMonth: Math.min(1, months - 1),
    endWeek: 3,
    color: '#60a5fa',
});

const newObjective = (months: number): GanttObjective => ({
    id: `obj-${Date.now()}`,
    name: 'OBJETIVO N° 1',
    activities: [newActivity(months)],
});

export const GanttProperties: React.FC<Props> = ({ block, onUpdateConfig }) => {
    const months: string[] = block.config.ganttMonths ?? MONTHS_DEFAULT;
    const objectives: GanttObjective[] = block.config.ganttObjectives ?? [newObjective(months.length)];
    const [expandedObj, setExpandedObj] = useState<string>(objectives[0]?.id ?? '');

    const updateMonths = (next: string[]) => onUpdateConfig(block.id, 'ganttMonths', next);
    const updateObjectives = (next: GanttObjective[]) => onUpdateConfig(block.id, 'ganttObjectives', next);

    // ── Months management ────────────────────────────────────────────────────
    const updateMonth = (idx: number, val: string) => {
        const next = [...months];
        next[idx] = val;
        updateMonths(next);
    };
    const addMonth = () => updateMonths([...months, `Mes ${months.length + 1}`]);
    const removeMonth = (idx: number) => {
        if (months.length <= 2) return;
        updateMonths(months.filter((_, i) => i !== idx));
        // Clamp activity ranges
        const clamp = months.length - 2;
        updateObjectives(objectives.map(obj => ({
            ...obj,
            activities: obj.activities.map(a => ({
                ...a,
                startMonth: Math.min(a.startMonth, clamp),
                endMonth: Math.min(a.endMonth, clamp),
            }))
        })));
    };

    // ── Objectives management ─────────────────────────────────────────────────
    const addObjective = () => {
        const next = [...objectives, newObjective(months.length)];
        updateObjectives(next);
        setExpandedObj(next[next.length - 1].id);
    };
    const removeObjective = (id: string) => {
        updateObjectives(objectives.filter(o => o.id !== id));
    };
    const updateObjectiveName = (id: string, name: string) => {
        updateObjectives(objectives.map(o => o.id === id ? { ...o, name } : o));
    };

    // ── Activities management ─────────────────────────────────────────────────
    const addActivity = (objId: string) => {
        updateObjectives(objectives.map(o => o.id !== objId ? o : {
            ...o, activities: [...o.activities, newActivity(months.length)]
        }));
    };
    const removeActivity = (objId: string, actId: string) => {
        updateObjectives(objectives.map(o => o.id !== objId ? o : {
            ...o, activities: o.activities.filter(a => a.id !== actId)
        }));
    };
    const updateActivity = (objId: string, actId: string, partial: Partial<GanttActivity>) => {
        updateObjectives(objectives.map(o => o.id !== objId ? o : {
            ...o, activities: o.activities.map(a => a.id !== actId ? a : { ...a, ...partial })
        }));
    };

    const inputCls = "w-full text-xs bg-surface border border-border-thin rounded-md px-2 py-1.5 text-text-main focus:outline-none";
    const selectCls = "w-full text-xs bg-surface border border-border-thin rounded-md px-2 py-1.5 text-text-main focus:outline-none";

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">

            {/* ── Configuración de meses ──────────────────────────────────────── */}
            <div className="space-y-2 p-3 border border-border-thin rounded-md bg-surface-hover/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-main" />
                        <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                            Meses del Cronograma ({months.length})
                        </span>
                    </div>
                    <button
                        onClick={addMonth}
                        className="flex items-center gap-1 px-2 py-0.5 border border-border-thin rounded-md text-[9px] font-semibold text-text-main bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <Plus className="w-3 h-3" /> Mes
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                    {months.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <input
                                value={m}
                                onChange={e => updateMonth(idx, e.target.value)}
                                className="flex-1 min-w-0 text-[9px] bg-surface border border-border-thin rounded px-1.5 py-1 text-text-main focus:outline-none"
                            />
                            <button
                                onClick={() => removeMonth(idx)}
                                className="shrink-0 text-text-dim hover:text-error transition-colors"
                                title="Eliminar mes"
                            >
                                <Trash2 className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Objetivos y Actividades ─────────────────────────────────────── */}
            <div className="space-y-2">
                {objectives.map((obj, oIdx) => (
                    <div key={obj.id} className="border border-border-thin rounded-md overflow-hidden">
                        {/* Header objetivo */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-surface-hover cursor-pointer select-none"
                            onClick={() => setExpandedObj(expandedObj === obj.id ? '' : obj.id)}>
                            <span className="text-[9px] font-black text-text-main bg-surface-hover px-1.5 py-0.5 rounded border border-border-thin">
                                OBJ {oIdx + 1}
                            </span>
                            <input
                                value={obj.name}
                                onChange={e => { e.stopPropagation(); updateObjectiveName(obj.id, e.target.value); }}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 bg-transparent text-xs font-bold text-text-main focus:outline-none"
                                placeholder="Nombre del objetivo"
                            />
                            <button
                                onClick={e => { e.stopPropagation(); removeObjective(obj.id); }}
                                className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors"
                                title="Eliminar objetivo"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                            {expandedObj === obj.id
                                ? <ChevronUp className="w-3.5 h-3.5 text-text-dim shrink-0" />
                                : <ChevronDown className="w-3.5 h-3.5 text-text-dim shrink-0" />
                            }
                        </div>

                        {/* Actividades */}
                        {expandedObj === obj.id && (
                            <div className="p-3 space-y-3 bg-surface">
                                {obj.activities.map((act, aIdx) => (
                                    <div key={act.id} className="p-2.5 border border-border-thin rounded-md bg-surface-hover/20 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                                                style={{ background: act.color }} />
                                            <span className="text-[9px] font-bold text-text-dim">ACT {aIdx + 1}</span>
                                            <button
                                                onClick={() => removeActivity(obj.id, act.id)}
                                                className="ml-auto p-0.5 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors"
                                            >
                                                <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                        </div>

                                        {/* Nombre */}
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-text-dim uppercase">Actividad</label>
                                            <input
                                                value={act.name}
                                                onChange={e => updateActivity(obj.id, act.id, { name: e.target.value })}
                                                className={inputCls}
                                                placeholder="Nombre de la actividad"
                                            />
                                        </div>

                                        {/* Recursos */}
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-text-dim uppercase">Recursos Necesarios</label>
                                            <input
                                                value={act.resources}
                                                onChange={e => updateActivity(obj.id, act.id, { resources: e.target.value })}
                                                className={inputCls}
                                                placeholder="Ej: Investigadores, equipos, presupuesto"
                                            />
                                        </div>

                                        {/* Rango de tiempo */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-text-dim uppercase">Inicio</label>
                                                <select
                                                    value={act.startMonth}
                                                    onChange={e => updateActivity(obj.id, act.id, { startMonth: +e.target.value })}
                                                    className={selectCls}
                                                >
                                                    {months.map((m, i) => (
                                                        <option key={i} value={i}>{m}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-1">
                                                    {[1,2,3,4].map(w => (
                                                        <button
                                                            key={w}
                                                            onClick={() => updateActivity(obj.id, act.id, { startWeek: w - 1 })}
                                                            className={`flex-1 py-0.5 text-[8px] font-bold rounded-md border transition-all ${
                                                                act.startWeek === w - 1
                                                                    ? 'bg-text-main text-bg-deep border-text-main'
                                                                    : 'border-border-thin bg-surface text-text-dim hover:border-border-hover'
                                                            }`}
                                                        >
                                                            S{w}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-text-dim uppercase">Fin</label>
                                                <select
                                                    value={act.endMonth}
                                                    onChange={e => updateActivity(obj.id, act.id, { endMonth: +e.target.value })}
                                                    className={selectCls}
                                                >
                                                    {months.map((m, i) => (
                                                        <option key={i} value={i}>{m}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-1">
                                                    {[1,2,3,4].map(w => (
                                                        <button
                                                            key={w}
                                                            onClick={() => updateActivity(obj.id, act.id, { endWeek: w - 1 })}
                                                            className={`flex-1 py-0.5 text-[8px] font-bold rounded-md border transition-all ${
                                                                act.endWeek === w - 1
                                                                    ? 'bg-text-main text-bg-deep border-text-main'
                                                                    : 'border-border-thin bg-surface text-text-dim hover:border-border-hover'
                                                            }`}
                                                        >
                                                            S{w}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color */}
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-text-dim uppercase">Color de Barra</label>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {GANTT_COLORS.map(c => (
                                                    <button
                                                        key={c.hex}
                                                        onClick={() => updateActivity(obj.id, act.id, { color: c.hex })}
                                                        title={c.label}
                                                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                                                            act.color === c.hex ? 'border-text-main scale-110' : 'border-border-thin/40 hover:scale-105'
                                                        }`}
                                                        style={{ background: c.hex }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addActivity(obj.id)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-dashed border-border-thin text-[9px] font-semibold text-text-dim hover:text-text-main hover:border-border-hover bg-surface hover:bg-surface-hover transition-all cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Añadir Actividad
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={addObjective}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-border-thin text-[10px] font-semibold text-text-dim hover:text-text-main hover:border-border-hover bg-surface hover:bg-surface-hover transition-all cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" /> Añadir Objetivo
                </button>
            </div>
        </div>
    );
};
