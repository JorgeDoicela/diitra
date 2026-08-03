import React, { useContext } from 'react';
import { Award, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';

interface ExpectedProductsSectionProps {
    productosEsperados?: any[];
    tiposProducto?: any[];
    cowork: CoWorkHandle;
    onAddProducto?: () => void;
    onRemoveProducto?: (index: number) => void;
    onUpdateProducto?: (index: number, field: string, value: any) => void;
    readOnly?: boolean;
    config?: any;
}

export const ExpectedProductsSection: React.FC<ExpectedProductsSectionProps> = ({
    productosEsperados = [],
    tiposProducto = [],
    cowork,
    onAddProducto,
    onRemoveProducto,
    onUpdateProducto,
    readOnly = false,
    config
}) => {
    const title = config?.productosTitle || '5. Productos Esperados';
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly;

    return (
        <SectionBlockGuard id="productos_esperados" title={title} showInlineLock={true}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Award size={18} /> {title}
                    </h4>
                    {!effectiveReadOnly && onAddProducto && (
                        <button
                            type="button"
                            onClick={onAddProducto}
                            className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-md transition-all cursor-pointer"
                        >
                            + Añadir Producto
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productosEsperados.map((_p, i) => (
                        <div key={_p.id || i} className="p-4 bg-bg-deep border border-border-thin rounded-xl flex gap-4 items-center animate-fade-in">
                            <div className="flex-1">
                                <label className="text-[9px] font-black uppercase text-text-dim mb-1 block ml-1">Tipo de Producto</label>
                                <select
                                    value={_p.tipo || ''}
                                    onChange={(e) => onUpdateProducto && onUpdateProducto(i, 'tipo', e.target.value)}
                                    disabled={effectiveReadOnly || cowork.session.readOnly}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs text-text-main outline-none appearance-none font-bold disabled:opacity-60"
                                >
                                    <option value="">Seleccione tipo...</option>
                                    {tiposProducto.map(t => (
                                        <option key={t.id_tipo_producto || t.idTipoProducto || t.nombre} value={t.nombre}>{t.nombre} ({t.categoria})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-16">
                                <CoWorkField
                                    name={`Prod_${_p.id || i}_cant`}
                                    cowork={cowork}
                                    label="Cant."
                                    onValueChange={(v) => onUpdateProducto && onUpdateProducto(i, 'cantidad', v)}
                                    readOnly={effectiveReadOnly}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center font-bold"
                                />
                            </div>
                            {!effectiveReadOnly && onRemoveProducto && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveProducto(i)}
                                    className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg mt-5 transition-all cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </SectionBlockGuard>
    );
};
