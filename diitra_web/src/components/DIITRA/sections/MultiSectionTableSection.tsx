import React from 'react';
import { Grid, Plus, Trash2, Calculator } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TableRowData {
    cells?: string[];
    [key: string]: any;
}

interface TableSectionConfig {
    title: string;
    headerStyle?: 'blue' | 'gold' | 'gray' | 'none';
    headers?: string[];
    colWidths?: string[];
    rows?: TableRowData[];
}

interface MultiSectionTableSectionProps {
    formData: any;
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any) => void;
    onAdd?: (listName: string, template: any) => void;
    onRemove?: (listName: string, index: number) => void;
    onUpdateItem?: (listName: string, index: number, field: string, value: any) => void;
    readOnly?: boolean;
    config?: any;
}

export const MultiSectionTableSection: React.FC<MultiSectionTableSectionProps> = ({
    formData = {},
    cowork,
    onAdd,
    onRemove,
    onUpdateItem,
    readOnly = false,
    config = {}
}) => {
    // Extraer la configuración del bloque
    const blockConfig = config?.config || config || {};
    const blockId = config?.blockId || blockConfig?.blockId || 'default';
    const sections: TableSectionConfig[] = blockConfig?.sections || [
        {
            title: 'Sección 1',
            headerStyle: 'blue',
            headers: ['Descripción', 'Cantidad', 'Fuente'],
            rows: [{ cells: ['', '', ''] }]
        },
        {
            title: 'Sección 2',
            headerStyle: 'gold',
            headers: ['Descripción', 'Costo'],
            rows: [{ cells: ['', ''] }]
        }
    ];

    // Helper para determinar el estilo CSS del encabezado
    const getHeaderStyleClass = (style?: 'blue' | 'gold' | 'gray' | 'none') => {
        switch (style) {
            case 'blue':
                return 'bg-[#1e2a4a] text-white border-[#151f38]';
            case 'gold':
                return 'bg-[#b8912e] text-white border-[#9c7823]';
            case 'gray':
                return 'bg-[#334155] text-white border-[#1e293b]';
            case 'none':
            default:
                return 'bg-secondary/40 text-foreground border-border-thin font-bold';
        }
    };

    // Helper para verificar si una columna es numérica / costo para auto-sumar
    const isNumericColumn = (headerName: string) => {
        const lower = (headerName || '').toLowerCase();
        return (
            lower.includes('costo') ||
            lower.includes('monto') ||
            lower.includes('total') ||
            lower.includes('precio') ||
            lower.includes('valor') ||
            lower.includes('subtotal') ||
            lower.includes('presupuesto')
        );
    };

    // Calcular el total general de todas las columnas de costo/monto en todas las sub-tablas
    let grandTotal = 0;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Cabecera del Bloque */}
            <div className="flex items-center justify-between pb-3 border-b border-border-thin">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Grid size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
                            {config?.title || blockConfig?.title || 'Tabla Multi-Sección'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Sub-tablas dinámicas configuradas desde la plantilla institucional.
                        </p>
                    </div>
                </div>
            </div>

            {/* Renderizado de Sub-Tablas */}
            {sections.map((sec, secIdx) => {
                const listKey = `MultiSec_${blockId}_${secIdx}`;
                const titleSlug = (sec.title || '').replace(/\s+/g, '').replace(/_/g, '');
                const aliasKey = titleSlug ? `MultiSec_${titleSlug}` : null;

                // Datos de la sub-tabla (Yjs -> alias -> defaultRows del Admin)
                const userRows = formData[listKey] || (aliasKey ? formData[aliasKey] : null) || [];
                const defaultRows = sec.rows || [{ cells: Array(sec.headers?.length || 2).fill('') }];
                const totalRowCount = Math.max(userRows.length, defaultRows.length, 1);

                const headers = sec.headers && sec.headers.length > 0 ? sec.headers : ['Columna 1', 'Columna 2'];
                const headerStyleClass = getHeaderStyleClass(sec.headerStyle);

                // Calcular subtotal numérico si aplica
                let sectionSubtotal = 0;
                let hasNumericCol = false;

                return (
                    <div
                        key={secIdx}
                        className="rounded-xl border border-border-thin bg-card/60 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                        {/* Título de la Sub-Tabla */}
                        <div className="px-4 py-3 bg-secondary/30 border-b border-border-thin flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                {sec.title || `Sección ${secIdx + 1}`}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background/80 border border-border-thin text-muted-foreground">
                                {headers.length} Columnas
                            </span>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className={`border-b ${headerStyleClass}`}>
                                        {headers.map((h, hIdx) => {
                                            if (isNumericColumn(h)) hasNumericCol = true;
                                            return (
                                                <th
                                                    key={hIdx}
                                                    className="p-3 text-[10px] font-black uppercase tracking-wider text-center border-r last:border-r-0 border-white/10"
                                                    style={{ width: sec.colWidths?.[hIdx] || 'auto' }}
                                                >
                                                    {h}
                                                </th>
                                            );
                                        })}
                                        {!readOnly && (
                                            <th className="p-3 text-[10px] font-black uppercase tracking-wider text-center w-12">
                                                Acciones
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin">
                                    {Array.from({ length: totalRowCount }).map((_, rIdx) => {
                                        const rowObj = userRows[rIdx] || {};
                                        const defaultCellValues = defaultRows[rIdx]?.cells || [];

                                        return (
                                            <tr
                                                key={rIdx}
                                                className="hover:bg-accent/40 transition-colors group"
                                            >
                                                {headers.map((h, cIdx) => {
                                                    const fieldName = `${listKey}[${rIdx}].col_${cIdx}`;
                                                    const rawVal = rowObj[`col_${cIdx}`] ?? rowObj[`cell_${cIdx}`] ?? defaultCellValues[cIdx] ?? '';

                                                    if (isNumericColumn(h)) {
                                                        const numVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, '')) || 0;
                                                        sectionSubtotal += numVal;
                                                        grandTotal += numVal;
                                                    }

                                                    return (
                                                        <td key={cIdx} className="p-2 border-r border-border-thin last:border-r-0">
                                                            {readOnly ? (
                                                                <div className="px-2 py-1.5 min-h-[32px] text-foreground font-medium flex items-center">
                                                                    {rawVal || <span className="text-muted-foreground/40 italic">-</span>}
                                                                </div>
                                                            ) : (
                                                                <CoWorkField
                                                                    name={fieldName}
                                                                    cowork={cowork}
                                                                    type="text"
                                                                    readOnly={readOnly}
                                                                    placeholder={`Ingrese ${h.toLowerCase()}...`}
                                                                    className="w-full px-2.5 py-1.5 bg-background border border-border-thin rounded-lg text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                                                    onValueChange={(val) => {
                                                                        if (onUpdateItem) {
                                                                            onUpdateItem(listKey, rIdx, `col_${cIdx}`, val);
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {!readOnly && (
                                                    <td className="p-2 text-center align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemove && onRemove(listKey, rIdx)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-all"
                                                            title="Eliminar fila"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pie de Sub-Tabla con Subtotal o Botón de Añadir Fila */}
                        <div className="px-4 py-2.5 bg-secondary/20 border-t border-border-thin flex items-center justify-between">
                            {!readOnly ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onAdd) {
                                            const emptyRow: Record<string, string> = {};
                                            headers.forEach((_, cIdx) => {
                                                emptyRow[`col_${cIdx}`] = '';
                                            });
                                            onAdd(listKey, emptyRow);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
                                >
                                    <Plus size={14} />
                                    <span>Añadir Fila</span>
                                </button>
                            ) : <div />}

                            {hasNumericCol && (
                                <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="text-muted-foreground uppercase text-[10px] font-sans font-bold">
                                        Subtotal {sec.title}:
                                    </span>
                                    <span className="font-bold text-foreground px-2.5 py-0.5 rounded bg-background border border-border-thin">
                                        ${sectionSubtotal.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Barra Resumen Global si hay valores numéricos */}
            {grandTotal > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                        <Calculator size={16} />
                        <span>Total Acumulado de la Tabla Multi-Sección:</span>
                    </div>
                    <div className="text-base font-black font-mono text-primary px-4 py-1.5 rounded-lg bg-background border border-primary/30 shadow-sm">
                        ${grandTotal.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSectionTableSection;
