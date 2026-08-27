import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { DocumentBlock, TableSection } from '../../types';
import { ColorPickerField } from './SharedColorPicker';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const newSection = (): TableSection => ({
    title: 'Nueva Sección',
    headerStyle: 'blue',
    headers: ['Columna 1', 'Columna 2'],
    colWidths: ['50%', '50%'],
    rows: [{ cells: ['', ''] }],
});

export const MultiSectionTableProperties: React.FC<Props> = ({ block, onUpdateConfig }) => {
    const sections: TableSection[] = block.config.sections ?? [newSection()];

    const update = (updated: TableSection[]) => {
        onUpdateConfig(block.id, 'sections', updated);
    };

    const updateSection = (sIdx: number, partial: Partial<TableSection>) => {
        const next = sections.map((s, i) => i === sIdx ? { ...s, ...partial } : s);
        update(next);
    };

    const addSection = () => update([...sections, newSection()]);
    const removeSection = (i: number) => update(sections.filter((_, idx) => idx !== i));

    const updateHeader = (sIdx: number, hIdx: number, val: string) => {
        const next = sections.map((s, i) => {
            if (i !== sIdx) return s;
            const headers = [...(s.headers ?? [])];
            headers[hIdx] = val;
            return { ...s, headers };
        });
        update(next);
    };

    const addColumn = (sIdx: number) => {
        const next = sections.map((s, i) => {
            if (i !== sIdx) return s;
            const cols = (s.headers?.length ?? 2) + 1;
            const w = `${Math.floor(100 / cols)}%`;
            return {
                ...s,
                headers: [...(s.headers ?? []), `Col ${cols}`],
                colWidths: Array(cols).fill(w),
                rows: (s.rows ?? []).map(r => ({ cells: [...r.cells, ''] })),
            };
        });
        update(next);
    };

    const removeColumn = (sIdx: number, cIdx: number) => {
        const next = sections.map((s, i) => {
            if (i !== sIdx) return s;
            return {
                ...s,
                headers: (s.headers ?? []).filter((_, ci) => ci !== cIdx),
                colWidths: (s.colWidths ?? []).filter((_, ci) => ci !== cIdx),
                rows: (s.rows ?? []).map(r => ({ cells: r.cells.filter((_, ci) => ci !== cIdx) })),
            };
        });
        update(next);
    };

    const addRow = (sIdx: number) => {
        const s = sections[sIdx];
        const cols = s.headers?.length ?? 2;
        const next = sections.map((sec, i) => i !== sIdx ? sec : {
            ...sec, rows: [...(sec.rows ?? []), { cells: Array(cols).fill('') }]
        });
        update(next);
    };

    const removeRow = (sIdx: number, rIdx: number) => {
        const next = sections.map((sec, i) => i !== sIdx ? sec : {
            ...sec, rows: (sec.rows ?? []).filter((_, ri) => ri !== rIdx)
        });
        update(next);
    };

    const updateCell = (sIdx: number, rIdx: number, cIdx: number, val: string) => {
        const next = sections.map((sec, i) => {
            if (i !== sIdx) return sec;
            const rows = sec.rows.map((row, ri) => {
                if (ri !== rIdx) return row;
                const cells = [...row.cells];
                cells[cIdx] = val;
                return { ...row, cells };
            });
            return { ...sec, rows };
        });
        update(next);
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">
            {sections.map((section, sIdx) => (
                <div key={sIdx} className="border border-border-thin rounded-md bg-surface overflow-hidden">
                    {/* Encabezado de sección */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-hover border-b border-border-thin/20">
                        <GripVertical className="w-3.5 h-3.5 text-text-dim shrink-0" />
                        <input
                            value={section.title}
                            onChange={e => updateSection(sIdx, { title: e.target.value })}
                            className="flex-1 bg-transparent text-xs font-bold text-text-main focus:outline-none placeholder:text-text-dim"
                            placeholder="Título de la sección"
                        />
                        <button
                            onClick={() => removeSection(sIdx)}
                            className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors"
                            title="Eliminar sección"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="p-3 space-y-3">
                        {/* Estilo de encabezado */}
                        <ColorPickerField
                            label="Estilo de Encabezado"
                            value={section.headerStyle ?? '#1e2a4a'}
                            onChange={val => updateSection(sIdx, { headerStyle: val as any })}
                        />

                        {/* Encabezados de columna */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                                    Columnas ({section.headers?.length ?? 0})
                                </label>
                                <button
                                    onClick={() => addColumn(sIdx)}
                                    className="flex items-center gap-1 px-2 py-0.5 border border-border-thin rounded-md text-[9px] font-semibold text-text-main bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Col
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {(section.headers ?? []).map((h, hIdx) => (
                                    <div key={hIdx} className="flex items-center gap-1 bg-surface border border-border-thin rounded-md px-2 py-1 min-w-0 flex-1">
                                        <input
                                            value={h}
                                            onChange={e => updateHeader(sIdx, hIdx, e.target.value)}
                                            className="flex-1 bg-transparent text-[10px] text-text-main focus:outline-none min-w-0"
                                            placeholder={`Col ${hIdx + 1}`}
                                        />
                                        {(section.headers?.length ?? 0) > 1 && (
                                            <button onClick={() => removeColumn(sIdx, hIdx)} className="text-text-dim hover:text-error transition-colors">
                                                <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Filas de datos */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                                    Filas ({section.rows?.length ?? 0})
                                </label>
                                <button
                                    onClick={() => addRow(sIdx)}
                                    className="flex items-center gap-1 px-2 py-0.5 border border-border-thin rounded-md text-[9px] font-semibold text-text-main bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Fila
                                </button>
                            </div>
                            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {(section.rows ?? []).map((row, rIdx) => (
                                    <div key={rIdx} className="flex gap-1 items-center group/row">
                                        {row.cells.map((cell, cIdx) => (
                                            <input
                                                key={cIdx}
                                                value={cell}
                                                onChange={e => updateCell(sIdx, rIdx, cIdx, e.target.value)}
                                                className="flex-1 min-w-0 text-[10px] bg-surface border border-border-thin rounded-md px-1.5 py-1 text-text-main focus:outline-none"
                                                placeholder={`Celda ${cIdx + 1}`}
                                            />
                                        ))}
                                        <button
                                            onClick={() => removeRow(sIdx, rIdx)}
                                            className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error opacity-0 group-hover/row:opacity-100 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addSection}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-border-thin text-[10px] font-semibold text-text-dim hover:text-text-main hover:border-border-hover bg-surface hover:bg-surface-hover transition-all cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" />
                Añadir Sub-tabla
            </button>
        </div>
    );
};
