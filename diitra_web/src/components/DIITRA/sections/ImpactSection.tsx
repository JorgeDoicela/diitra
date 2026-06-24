import React, { useContext } from 'react';
import { Award, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';

interface ImpactSectionProps {
    productosEsperados: any[];
    tiposProducto: any[];
    cowork: CoWorkHandle;
    onAddProducto: () => void;
    onRemoveProducto: (index: number) => void;
    onUpdateProducto: (index: number, field: string, value: any) => void;
    onUpdateImpacto: (tipo: string, value: string) => void;
    onUpdate?: (field: string, value: any) => void;
    readOnly?: boolean;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
    productosEsperados,
    tiposProducto,
    cowork,
    onAddProducto,
    onRemoveProducto,
    onUpdateProducto,
    onUpdateImpacto,
    readOnly = false
}) => {
    return (
        <div className="space-y-12">
            {/* 5. Productos Esperados */}
            <SectionBlockGuard id="productos_esperados" title="5. Productos Esperados" showInlineLock={true}>
                <ProductosEsperadosBlock 
                    productosEsperados={productosEsperados}
                    tiposProducto={tiposProducto}
                    cowork={cowork}
                    onAddProducto={onAddProducto}
                    onRemoveProducto={onRemoveProducto}
                    onUpdateProducto={onUpdateProducto}
                    parentReadOnly={readOnly}
                />
            </SectionBlockGuard>

            {/* 6. Matriz de Impacto */}
            <SectionBlockGuard id="matriz_impacto" title="6. Matriz de Impacto" showInlineLock={true}>
                <MatrizImpactoBlock 
                    cowork={cowork}
                    onUpdateImpacto={onUpdateImpacto}
                    parentReadOnly={readOnly}
                />
            </SectionBlockGuard>
        </div>
    );
};

const ProductosEsperadosBlock: React.FC<{
    productosEsperados: any[];
    tiposProducto: any[];
    cowork: CoWorkHandle;
    onAddProducto: () => void;
    onRemoveProducto: (index: number) => void;
    onUpdateProducto: (index: number, field: string, value: any) => void;
    parentReadOnly?: boolean;
}> = ({
    productosEsperados,
    tiposProducto,
    cowork,
    onAddProducto,
    onRemoveProducto,
    onUpdateProducto,
    parentReadOnly = false
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const readOnly = parentReadOnly || blockReadOnly;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Award size={18}/> 5. Productos Esperados
                </h4>
                {!readOnly && (
                    <button 
                        onClick={onAddProducto} 
                        className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-md transition-all"
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
                                value={_p.tipo}
                                onChange={(e) => onUpdateProducto(i, 'tipo', e.target.value)}
                                disabled={readOnly || cowork.session.readOnly}
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
                                onValueChange={(v) => onUpdateProducto(i, 'cantidad', v)}
                                readOnly={readOnly}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center font-bold" 
                            />
                        </div>
                        {!readOnly && (
                            <button 
                                onClick={() => onRemoveProducto(i)} 
                                className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg mt-5 transition-all"
                            >
                                <Trash2 size={16}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MatrizImpactoBlock: React.FC<{
    cowork: CoWorkHandle;
    onUpdateImpacto: (tipo: string, value: string) => void;
    parentReadOnly?: boolean;
}> = ({
    cowork,
    onUpdateImpacto,
    parentReadOnly = false
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const readOnly = parentReadOnly || blockReadOnly;

    return (
        <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest px-2">6. Matriz de Impacto</h4>
            <div className="grid grid-cols-1 gap-3">
                {['Social', 'Cientifico', 'Economico', 'Politico', 'Ambiental', 'Otro'].map((tipo) => (
                    <div key={tipo} className="p-5 bg-bg-deep border border-border-thin rounded-2xl flex gap-6 items-center shadow-sm">
                        <div className="w-32 text-[10px] font-black uppercase text-text-main">{tipo}</div>
                        <CoWorkField 
                            name={`Impacto_${tipo}`} 
                            cowork={cowork} 
                            placeholder={`Describa el impacto ${tipo.toLowerCase()} del proyecto...`}
                            onValueChange={(v) => onUpdateImpacto(tipo, v)}
                            readOnly={readOnly}
                            className="flex-1 bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs" 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
