import React from 'react';
import { 
    GripVertical, User, Clock, ChevronUp, ChevronDown, 
    Target, Trash2, Palette, FileCheck 
} from 'lucide-react';
import { CoWorkField } from '../../../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../../../core/cowork/types';

interface ActivityCardItemProps {
    item: any;
    index: number;
    totalWeeks: number;
    months: { name: string; year: number; weeksCount: number; weekOffset: number }[];
    objectives: { index: number; label: string }[];
    teamMembers: string[];
    formData: any;
    cowork: CoWorkHandle;
    isExpanded: boolean;
    isDragging: boolean;
    isDragOver: boolean;
    readOnly: boolean;
    colorsPalette: string[];
    setExpandedCard: (idx: number | null) => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: string, value: any) => void;
    parseProjectDate: (dStr: any) => Date | null;
    formatDateForInput: (dStr: any) => string;
    getWeekRange: (semanas: boolean[]) => { start: number; end: number };
    handleCardDragStart: (e: React.DragEvent, index: number) => void;
    handleCardDragOver: (e: React.DragEvent, index: number) => void;
    handleCardDragEnd: () => void;
    handleCardDrop: (e: React.DragEvent, index: number) => void;
    handleActivityDateChange: (index: number, type: 'start' | 'end', dateValue: string) => void;
}

export const ActivityCardItem: React.FC<ActivityCardItemProps> = ({
    item: _c,
    index: i,
    totalWeeks,
    months,
    objectives,
    teamMembers,
    formData,
    cowork,
    isExpanded,
    isDragging,
    isDragOver,
    readOnly,
    colorsPalette,
    setExpandedCard,
    onRemove,
    onUpdate,
    parseProjectDate,
    formatDateForInput,
    getWeekRange,
    handleCardDragStart,
    handleCardDragOver,
    handleCardDragEnd,
    handleCardDrop,
    handleActivityDateChange
}) => {
    const activityColor = _c.colorHex || '#0070f3';
    const number = _c.Numero || (i + 1);
    const name = _c.Actividad || 'Nueva Actividad de Investigación';
    const checkedWeeksCount = (_c.Semanas || []).filter((w: boolean) => w === true).length;
    const progressPercent = totalWeeks > 0 ? Math.round((checkedWeeksCount / totalWeeks) * 100) : 0;

    return (
        <div 
            key={_c.id || _c.uuid || i} 
            draggable={!readOnly}
            onDragStart={(e) => handleCardDragStart(e, i)}
            onDragOver={(e) => handleCardDragOver(e, i)}
            onDragEnd={handleCardDragEnd}
            onDrop={(e) => handleCardDrop(e, i)}
            className={`bg-bg-deep border border-border-thin rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all duration-200 ${
                isDragging ? 'opacity-30 border-dashed border-text-main bg-bg-deep/20 scale-[0.98]' : ''
            } ${
                isDragOver ? 'border-t-4 border-t-text-main pt-2 bg-text-main/5' : ''
            }`}
        >
            {/* Cabecera del Accordion con Drag Handle */}
            <div className="flex items-center select-none pl-3 hover:bg-bg-deep/25">
                {/* Grip Handle */}
                {!readOnly && (
                    <div 
                        className="text-text-dim hover:text-text-main cursor-grab active:cursor-grabbing p-2.5 rounded-lg mr-1.5 transition-colors"
                        title="Arrastrar para reordenar"
                    >
                        <GripVertical size={14} />
                    </div>
                )}
                
                <div 
                    onClick={() => setExpandedCard(isExpanded ? null : i)}
                    className="p-4 flex items-center justify-between w-full cursor-pointer"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                            className="w-1 h-5 rounded-full shrink-0" 
                            style={{ backgroundColor: activityColor }} 
                        />
                        <span className="font-mono text-[11px] font-black select-none text-text-dim">
                            {String(number).padStart(2, '0')}.
                        </span>
                        <div className="space-y-0.5 truncate">
                            <h6 className="text-[12px] font-black text-text-main truncate max-w-[280px] sm:max-w-[400px]">
                                {name}
                            </h6>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim">
                                {_c.Responsable && (
                                    <span className="flex items-center gap-1">
                                        <User size={12} className="opacity-75" /> {_c.Responsable}
                                    </span>
                                )}
                                {_c.FechaInicioPrevista && _c.FechaFinPrevista && (
                                    <span className="flex items-center gap-1 font-semibold text-emerald-500">
                                        <Clock size={12} /> {parseProjectDate(_c.FechaInicioPrevista)?.toLocaleDateString('es-EC')} - {parseProjectDate(_c.FechaFinPrevista)?.toLocaleDateString('es-EC')}
                                    </span>
                                )}
                                {_c.EsEntregableCaces === true && (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-[8px] font-black text-emerald-500 uppercase tracking-wider">
                                        CACES
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex items-center gap-2.5">
                            <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">Ponderación:</span>
                            <span className="font-black text-text-main text-[11px]">{checkedWeeksCount} Semanas ({progressPercent}%)</span>
                        </div>
                        <div className="text-text-dim p-1.5 rounded-lg hover:bg-bg-deep/80 transition-colors">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido expandido */}
            {isExpanded && (
                <div className="p-5 border-t border-border-thin/40 bg-bg-deep/10 space-y-5 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        {/* Orden / Número */}
                        <div className="col-span-1 lg:col-span-1">
                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5">N° Orden</label>
                            <input
                                type="number"
                                value={_c.Numero || (i + 1)}
                                onChange={(e) => onUpdate(i, 'Numero', parseInt(e.target.value) || 1)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs font-bold text-center focus:border-text-main focus:outline-none"
                                disabled={readOnly}
                                min={1}
                            />
                        </div>

                        {/* Descripción / Actividad */}
                        <div className="col-span-1 lg:col-span-4">
                            <CoWorkField 
                                name={`Cron_${_c.id || i}_act`} 
                                cowork={cowork} 
                                label="Actividad"
                                onValueChange={(v) => onUpdate(i, 'Actividad', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold"
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Alineación de Objetivos */}
                        <div className="col-span-1 lg:col-span-3">
                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <Target size={10} /> Objetivo Relacionado
                            </label>
                            <select
                                value={_c.IdObjetivo !== undefined ? _c.IdObjetivo : 0}
                                onChange={(e) => onUpdate(i, 'IdObjetivo', parseInt(e.target.value) || 0)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none cursor-pointer"
                                disabled={readOnly}
                            >
                                {objectives.map((obj) => (
                                    <option key={obj.index} value={obj.index}>
                                        {obj.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Responsable de la actividad */}
                        <div className="col-span-1 lg:col-span-3">
                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <User size={10} /> Responsable
                            </label>
                            {teamMembers.length > 0 ? (
                                <select
                                    value={_c.Responsable || ''}
                                    onChange={(e) => onUpdate(i, 'Responsable', e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none cursor-pointer"
                                    disabled={readOnly}
                                >
                                    <option value="">-- Seleccionar Integrante --</option>
                                    {teamMembers.map((m, idx) => (
                                        <option key={idx} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Nombre del responsable"
                                    value={_c.Responsable || ''}
                                    onChange={(e) => onUpdate(i, 'Responsable', e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                    disabled={readOnly}
                                />
                            )}
                        </div>

                        {/* Botón de borrado */}
                        <div className="col-span-1 lg:col-span-1 flex justify-center pb-1">
                            {!readOnly && (
                                <button 
                                    onClick={() => onRemove(i)} 
                                    className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                    title="Eliminar Actividad"
                                >
                                    <Trash2 size={15}/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Planificación Temporal (Fechas específicas) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-thin/40 pt-4">
                        <div>
                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <Clock size={11} /> Fecha Inicio Prevista
                            </label>
                            <input
                                type="date"
                                value={formatDateForInput(_c.FechaInicioPrevista)}
                                min={formatDateForInput(formData?.FechaInicio || formData?.FechaInicioEstimada)}
                                max={formatDateForInput(formData?.FechaFin || formData?.FechaFinEstimada)}
                                onChange={(e) => handleActivityDateChange(i, 'start', e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                disabled={readOnly}
                            />
                        </div>
                        <div>
                            <label className="block text-[8px] font-black text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <Clock size={11} /> Fecha Fin Prevista
                            </label>
                            <input
                                type="date"
                                value={formatDateForInput(_c.FechaFinPrevista)}
                                min={formatDateForInput(_c.FechaInicioPrevista || formData?.FechaInicio || formData?.FechaInicioEstimada)}
                                max={formatDateForInput(formData?.FechaFin || formData?.FechaFinEstimada)}
                                onChange={(e) => handleActivityDateChange(i, 'end', e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs font-semibold focus:border-text-main focus:outline-none"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    {/* Recursos y Entregables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <CoWorkField 
                                name={`Cron_${_c.id || i}_rec`} 
                                cowork={cowork} 
                                label="Recursos Necesarios"
                                onValueChange={(v) => onUpdate(i, 'RecursosNecesarios', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs"
                                readOnly={readOnly}
                            />
                        </div>
                        <div>
                            <CoWorkField 
                                name={`Cron_${_c.id || i}_ent`} 
                                cowork={cowork} 
                                label="Entregable Esperado / Evidencia CACES"
                                onValueChange={(v) => onUpdate(i, 'Entregable', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs"
                                placeholder="Ej: Manual de software, Base de datos, Rúbrica firmada..."
                                readOnly={readOnly}
                            />
                        </div>
                    </div>

                    {/* Configuración estética (Colores) y CACES */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-deep/20 p-3 rounded-xl border border-border-thin/50 text-[10px]">
                        {/* Selector de color */}
                        <div className="flex items-center gap-3">
                            <span className="font-black text-text-dim uppercase tracking-wider flex items-center gap-1">
                                <Palette size={12} /> Color:
                            </span>
                            <div className="flex items-center gap-1.5">
                                {colorsPalette.map((col) => (
                                    <button
                                        key={col}
                                        onClick={() => onUpdate(i, 'colorHex', col)}
                                        className="w-3.5 h-3.5 rounded-full border border-border-thin hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                                        style={{ 
                                            backgroundColor: col, 
                                            boxShadow: _c.colorHex === col ? `0 0 0 2px var(--color-text-main, #0070f3)` : 'none' 
                                        }}
                                        title={`Color ${col}`}
                                        disabled={readOnly}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Checklist CACES e Indicador de Progreso */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-text-dim uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={_c.EsEntregableCaces || false}
                                    onChange={(e) => onUpdate(i, 'EsEntregableCaces', e.target.checked)}
                                    className="w-3.5 h-3.5 accent-text-main rounded cursor-pointer"
                                    disabled={readOnly}
                                />
                                <span>Acreditación CACES</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <span className="font-black text-text-dim uppercase tracking-wider">Progreso:</span>
                                <div className="w-16 h-2 bg-bg-deep rounded-full overflow-hidden border border-border-thin/80">
                                    <div 
                                        className="h-full transition-all duration-300" 
                                        style={{ width: `${progressPercent}%`, backgroundColor: activityColor }}
                                    />
                                </div>
                                <span className="font-black text-text-main text-[9px] grandfather">{progressPercent}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Cuadrícula Gantt Semanal Interactiva */}
                    <div className="border-t border-border-thin pt-3.5 space-y-2 select-none">
                        <div className="text-[9px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1">
                            <FileCheck size={13} /> 
                            <span>Programación de Semanas Activas</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {months.map((m, mIdx) => (
                                <div key={mIdx} className="bg-bg-deep/20 rounded-xl p-2.5 border border-border-thin/70 hover:border-border-thin transition-colors">
                                    <div className="text-[8.5px] font-black text-text-dim uppercase tracking-wider mb-2 text-center border-b border-border-thin/40 pb-1">
                                        {m.name} <span className="opacity-50">{m.year}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[0, 1, 2, 3].map((wIdx) => {
                                            const weekNum = m.weekOffset + wIdx;
                                            const currentSemanas = _c.Semanas || Array(totalWeeks).fill(false);
                                            const isChecked = currentSemanas[weekNum] === true;

                                            return (
                                                <button 
                                                    key={weekNum} 
                                                    onClick={() => {
                                                        if (readOnly) return;
                                                        const newSemanas = [...currentSemanas];
                                                        newSemanas[weekNum] = !newSemanas[weekNum];
                                                        onUpdate(i, 'Semanas', newSemanas);

                                                        // Sync dates of this activity based on the updated range
                                                        const { start, end } = getWeekRange(newSemanas);
                                                        const projectStartDate = parseProjectDate(formData?.FechaInicio || formData?.FechaInicioEstimada);
                                                        if (start !== -1 && projectStartDate) {
                                                            const actStart = new Date(projectStartDate.getTime());
                                                            actStart.setDate(projectStartDate.getDate() + start * 7);
                                                            onUpdate(i, 'FechaInicioPrevista', formatDateForInput(actStart));

                                                            const actEnd = new Date(projectStartDate.getTime());
                                                            actEnd.setDate(projectStartDate.getDate() + (end + 1) * 7 - 1);
                                                            onUpdate(i, 'FechaFinPrevista', formatDateForInput(actEnd));
                                                        }
                                                    }}
                                                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                                                        isChecked 
                                                            ? 'bg-text-main/5 border-text-main/30 font-bold text-text-main shadow-sm' 
                                                            : 'bg-transparent border-transparent hover:border-border-thin/50 text-text-dim hover:text-text-main'
                                                    }`}
                                                    disabled={readOnly}
                                                >
                                                    <span className="text-[7.5px]">Sem {weekNum + 1}</span>
                                                    <div 
                                                        className="w-3 h-3 rounded-sm border transition-all"
                                                        style={{ 
                                                            backgroundColor: isChecked ? activityColor : 'transparent',
                                                            borderColor: isChecked ? activityColor : 'var(--color-border-thin)' 
                                                        }}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
