import React from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface BudgetSectionProps {
    recursosDisponibles: any[];
    recursosNecesarios: any[];
    costoTotal: number;
    cowork: CoWorkHandle;
    onAddDisponible: () => void;
    onRemoveDisponible: (index: number) => void;
    onUpdateDisponible: (index: number, field: string, value: any) => void;
    onAddNecesario: () => void;
    onRemoveNecesario: (index: number) => void;
    onUpdateNecesario: (index: number, field: string, value: any) => void;
    formData: any;
    onUpdate: (field: string, value: any) => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
    recursosDisponibles,
    recursosNecesarios,
    costoTotal,
    cowork,
    onAddDisponible,
    onRemoveDisponible,
    onUpdateDisponible,
    onAddNecesario,
    onRemoveNecesario,
    onUpdateNecesario,
    formData,
    onUpdate
}) => {
    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                    <DollarSign size={18}/> 4. Recursos y Presupuesto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recursos Disponibles */}
                    <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] font-black uppercase text-text-dim">4.1 Recursos Disponibles</p>
                            <button 
                                onClick={onAddDisponible} 
                                className="p-2 bg-text-main text-bg-deep rounded-lg"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recursosDisponibles.map((_r, i) => (
                                <div key={_r.id || i} className="flex gap-2 items-center">
                                    <CoWorkField 
                                        name={`RecDisp_${_r.id || i}_desc`} 
                                        cowork={cowork} 
                                        placeholder="Descripción del recurso..."
                                        onValueChange={(v) => onUpdateDisponible(i, 'Descripcion', v)}
                                        className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" 
                                    />
                                    <div className="w-16">
                                        <CoWorkField 
                                            name={`RecDisp_${_r.id || i}_cant`} 
                                            cowork={cowork} 
                                            placeholder="Cant."
                                            onValueChange={(v) => onUpdateDisponible(i, 'Cantidad', v)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => onRemoveDisponible(i)} 
                                        className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recursos Necesarios */}
                    <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[10px] font-black uppercase text-text-dim">4.2 Recursos Necesarios (Gasto)</p>
                            <button 
                                onClick={onAddNecesario} 
                                className="p-2 bg-text-main text-bg-deep rounded-lg"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recursosNecesarios.map((r, i) => (
                                <div key={r.id || i} className="flex gap-2 items-center">
                                    <CoWorkField 
                                        name={`RecNec_${r.id || i}_desc`} 
                                        cowork={cowork} 
                                        placeholder="Descripción del rubro..."
                                        onValueChange={(v) => onUpdateNecesario(i, 'Descripcion', v)}
                                        className="flex-1 bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs" 
                                    />
                                    <div className="w-12">
                                        <CoWorkField 
                                            name={`RecNec_${r.id || i}_cant`} 
                                            cowork={cowork} 
                                            onValueChange={(v) => {
                                                const c = parseFloat(v) || 0;
                                                onUpdateNecesario(i, 'Cantidad', c);
                                                onUpdateNecesario(i, 'CostoTotal', c * (r.CostoUnitario || 0));
                                            }}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-center" 
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="w-20 md:w-24">
                                        <CoWorkField 
                                            name={`RecNec_${r.id || i}_unit`} 
                                            cowork={cowork} 
                                            onValueChange={(v) => {
                                                const u = parseFloat(v) || 0;
                                                onUpdateNecesario(i, 'CostoUnitario', u);
                                                onUpdateNecesario(i, 'CostoTotal', (r.Cantidad || 1) * u);
                                            }}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-2 py-2 text-xs text-right" 
                                            placeholder="$ 0.00"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => onRemoveNecesario(i)} 
                                        className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-border-thin flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-text-dim">Costo Total Estimado</span>
                                <span className="text-sm font-black text-text-main">$ {costoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4.3 Financiamiento (X) */}
            <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl space-y-4 shadow-sm">
                <p className="text-[10px] font-black uppercase text-text-dim">4.3 Fuentes de Financiamiento</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <label className="flex items-center gap-3 p-4 bg-bg-deep border border-border-thin rounded-xl cursor-pointer hover:bg-surface-hover transition-colors">
                        <input 
                            type="checkbox" 
                            checked={formData.FinanciamientoIstpet || false}
                            onChange={(e) => onUpdate('FinanciamientoIstpet', e.target.checked)}
                            className="w-4 h-4 rounded text-text-main focus:ring-0 accent-text-main"
                        />
                        <span className="text-xs font-black uppercase text-text-main">ISTPET</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-bg-deep border border-border-thin rounded-xl cursor-pointer hover:bg-surface-hover transition-colors">
                        <input 
                            type="checkbox" 
                            checked={formData.FinanciamientoOtrasFuentes || false}
                            onChange={(e) => onUpdate('FinanciamientoOtrasFuentes', e.target.checked)}
                            className="w-4 h-4 rounded text-text-main focus:ring-0 accent-text-main"
                        />
                        <span className="text-xs font-black uppercase text-text-main">OTRAS FUENTES</span>
                    </label>

                    {formData.FinanciamientoOtrasFuentes && (
                        <div className="space-y-2">
                            <CoWorkField 
                                name="NombresOtrasFuentes" 
                                cowork={cowork} 
                                label="Nombre de las Fuentes Externas" 
                                onValueChange={(v) => onUpdate('NombresOtrasFuentes', v)}
                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main" 
                                placeholder="Especifique nombres..."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
