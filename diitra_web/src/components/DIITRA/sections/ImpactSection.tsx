import React from 'react';
import { Award, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface ImpactSectionProps {
    productosEsperados: any[];
    tiposProducto: any[];
    cowork: CoWorkHandle;
    onAddProducto: () => void;
    onRemoveProducto: (index: number) => void;
    onUpdateProducto: (index: number, field: string, value: any) => void;
    onUpdateImpacto: (tipo: string, value: string) => void;
    formData: any;
    onUpdate: (field: string, value: any) => void;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
    productosEsperados,
    tiposProducto,
    cowork,
    onAddProducto,
    onRemoveProducto,
    onUpdateProducto,
    onUpdateImpacto,
    formData,
    onUpdate
}) => {
    return (
        <div className="space-y-12">
            {/* 5. Productos Esperados */}
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Award size={18}/> 5. Productos Esperados
                    </h4>
                    <button 
                        onClick={onAddProducto} 
                        className="px-4 py-2 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-md"
                    >
                        + Añadir Producto
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productosEsperados.map((_p, i) => (
                        <div key={_p.id || i} className="p-4 bg-bg-deep border border-border-thin rounded-xl flex gap-4 items-center animate-fade-in">
                            <div className="flex-1">
                                <label className="text-[9px] font-black uppercase text-text-dim mb-1 block ml-1">Tipo de Producto</label>
                                <select 
                                    value={_p.tipo}
                                    onChange={(e) => onUpdateProducto(i, 'tipo', e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-2.5 text-xs text-text-main outline-none appearance-none font-bold"
                                >
                                    <option value="">Seleccione tipo...</option>
                                    {tiposProducto.map(t => (
                                        <option key={t.idTipoProducto} value={t.nombre}>{t.nombre} ({t.categoria})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-16">
                                <CoWorkField 
                                    name={`Prod_${_p.id || i}_cant`} 
                                    cowork={cowork} 
                                    label="Cant."
                                    onValueChange={(v) => onUpdateProducto(i, 'cantidad', v)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center font-bold" 
                                />
                            </div>
                            <button 
                                onClick={() => onRemoveProducto(i)} 
                                className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg mt-5"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. Matriz de Impacto */}
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
                                className="flex-1 bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs" 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 9. Firmas de Responsabilidad */}
            <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl space-y-6 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest px-2">9. Firmas de Responsabilidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Director */}
                    <div className="p-5 bg-bg-deep border border-border-thin rounded-xl space-y-4">
                        <span className="text-[10px] font-black uppercase text-text-dim">Elaborado por: Director del Proyecto</span>
                        <CoWorkField 
                            name="Firmas_DirectorNombre" 
                            cowork={cowork} 
                            label="Título abreviado, Apellidos y Nombres Completos" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DirectorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-bold" 
                            placeholder="Ej: Mgs. Juan Pérez"
                        />
                        <CoWorkField 
                            name="Firmas_DirectorCargo" 
                            cowork={cowork} 
                            label="Cargo del Elaborador" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DirectorCargo: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-dim" 
                            placeholder="Director del Proyecto"
                        />
                    </div>

                    {/* Coordinador */}
                    <div className="p-5 bg-bg-deep border border-border-thin rounded-xl space-y-4">
                        <span className="text-[10px] font-black uppercase text-text-dim">Aprobado por: Coordinador de Carrera</span>
                        <CoWorkField 
                            name="Firmas_CoordinadorNombre" 
                            cowork={cowork} 
                            label="Título abreviado, Apellidos y Nombres Completos" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), CoordinadorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-bold" 
                            placeholder="Ej: Mgs. Carlos Gómez"
                        />
                        <CoWorkField 
                            name="Firmas_CoordinadorCargo" 
                            cowork={cowork} 
                            label="Cargo del Aprobador" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), CoordinadorCargo: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-dim" 
                            placeholder="Coordinador de Carrera"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
