import React from 'react';
import { 
    Activity, 
    Upload, 
    TrendingUp, 
    Trash2, 
    Plus, 
    CheckCircle2
} from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';

interface ProgressReportSectionProps {
    formData: any;
    cowork: any;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' }) => void;
    onAdd: (list: string, template: any) => void;
    onRemove: (list: string, index: number) => void;
    onUpdateItem: (list: string, index: number, field: string, value: any) => void;
}

export const ProgressReportSection: React.FC<ProgressReportSectionProps> = ({
    formData,
    cowork,
    onUpdate,
    onAdd,
    onRemove,
    onUpdateItem
}) => {
    const isReadOnly = cowork?.session?.readOnly;

    // List references from collaborative schema
    const hitos = formData.HitosCompletados || [];
    const evidencias = formData.Evidencias || [];
    const presupuesto = formData.PresupuestoEjecutado || [];

    // Financial aggregation
    const totalPlanificado = presupuesto.reduce((acc: number, curr: any) => acc + (Number(curr.Planificado) || 0), 0);
    const totalReal = presupuesto.reduce((acc: number, curr: any) => acc + (Number(curr.Real) || 0), 0);
    const desviacionTotal = totalReal - totalPlanificado;

    const handleAddHito = () => {
        onAdd('HitosCompletados', { Actividad: '', Avance: 0, HitoCompletado: false });
    };

    const handleAddEvidencia = () => {
        onAdd('Evidencias', { Descripcion: '', Categoria: 'Bitácora', UrlEvidencia: '' });
    };

    const handleAddPresupuesto = () => {
        onAdd('PresupuestoEjecutado', { Descripcion: '', Rubro: 'Equipos', Planificado: 0, Real: 0, Factura: '' });
    };

    return (
        <div className="space-y-12 animate-fade-in pb-10 text-white">
            
            {/* 1. SECCIÓN DE BITÁCORA COLABORATIVA */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6 bg-glow">
                <div className="flex items-center gap-3 border-b border-border-thin pb-4">
                    <div className="p-2 bg-text-main/10 rounded-xl text-text-main">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-text-main">1. Bitácora Científica & Conclusiones</h4>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Documentación en tiempo real del progreso experimental</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[9px] font-black text-text-dim uppercase tracking-widest ml-1">
                        Notas Técnicas y Avances Teóricos / Prácticos (Colaborativo)
                    </label>
                    <div className="border border-border-thin rounded-2xl overflow-hidden bg-bg-deep focus-within:ring-2 focus-within:ring-text-main/15 transition-all">
                        <CoWorkEditor 
                            field="ConclusionesParciales" 
                            cowork={cowork} 
                            onChange={(html, meta) => onUpdate('ConclusionesParciales', html, meta)} 
                        />
                    </div>
                </div>
            </div>

            {/* 2. CRONOGRAMA DE GANTT: % DE AVANCE */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">2. Avance de Actividades Cronograma</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Monitoreo granular del progreso de hitos CACES</p>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <button 
                            type="button"
                            onClick={handleAddHito}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                        >
                            <Plus size={12} strokeWidth={3} /> Agregar Actividad
                        </button>
                    )}
                </div>

                {hitos.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#222] rounded-2xl font-mono text-xs text-text-dim">
                        No se han declarado actividades de cronograma para este informe de avance.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {hitos.map((item: any, index: number) => (
                            <div key={index} className="p-5 border border-border-thin rounded-2xl bg-bg-deep/40 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-[#333] transition-colors relative">
                                <div className="flex-1 space-y-4 md:space-y-0 md:flex md:items-center gap-6">
                                    {/* Actividad input (Collaborative field inside list) */}
                                    <div className="flex-1">
                                        <CoWorkField 
                                            name={`HitosCompletados.${index}.Actividad`}
                                            cowork={cowork}
                                            label={`Actividad / Hito #${index + 1}`}
                                            placeholder="Ej: Levantamiento de requerimientos de la comunidad..."
                                            onValueChange={(v) => onUpdateItem('HitosCompletados', index, 'Actividad', v)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs text-text-main"
                                        />
                                    </div>

                                    {/* Range slider for Avance */}
                                    <div className="w-full md:w-56 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-text-dim">Progreso Real</span>
                                            <span className="text-blue-400 font-mono text-xs">{item.Avance || 0}%</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            disabled={isReadOnly}
                                            value={item.Avance || 0}
                                            onChange={(e) => onUpdateItem('HitosCompletados', index, 'Avance', Number(e.target.value))}
                                            className="w-full accent-blue-500 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Hito Completado Checkbox */}
                                    <div className="flex items-center gap-2 pt-2 md:pt-4">
                                        <input 
                                            type="checkbox"
                                            id={`hito-${index}`}
                                            disabled={isReadOnly}
                                            checked={!!item.HitoCompletado}
                                            onChange={(e) => onUpdateItem('HitosCompletados', index, 'HitoCompletado', e.target.checked)}
                                            className="w-4 h-4 rounded border-border-thin text-blue-500 focus:ring-0 cursor-pointer bg-bg-deep"
                                        />
                                        <label htmlFor={`hito-${index}`} className="text-[10px] font-bold text-gray-300 select-none uppercase tracking-wider">
                                            Completado
                                        </label>
                                    </div>
                                </div>

                                {!isReadOnly && (
                                    <button 
                                        type="button"
                                        onClick={() => onRemove('HitosCompletados', index)}
                                        className="p-2 hover:bg-red-500/10 text-text-dim hover:text-red-500 border border-transparent hover:border-red-500/20 rounded-xl transition-all self-end md:self-auto"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. EVIDENCIAS FÍSICAS */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">3. Bitácoras & Evidencias Físicas</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Enlace e indexación de evidencias de campo y laboratorio</p>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <button 
                            type="button"
                            onClick={handleAddEvidencia}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                        >
                            <Plus size={12} strokeWidth={3} /> Agregar Evidencia
                        </button>
                    )}
                </div>

                {evidencias.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#222] rounded-2xl font-mono text-xs text-text-dim">
                        No hay evidencias indexadas en este informe.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evidencias.map((item: any, index: number) => (
                            <div key={index} className="p-5 border border-border-thin rounded-2xl bg-bg-deep/40 space-y-4 relative group hover:border-[#333] transition-all">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                        Evidencia #{index + 1}
                                    </span>
                                    {!isReadOnly && (
                                        <button 
                                            type="button"
                                            onClick={() => onRemove('Evidencias', index)}
                                            className="p-1 hover:bg-red-500/10 text-text-dim hover:text-red-500 rounded transition-all"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Categoría</label>
                                        <select 
                                            disabled={isReadOnly}
                                            value={item.Categoria || 'Bitácora'}
                                            onChange={(e) => onUpdateItem('Evidencias', index, 'Categoria', e.target.value)}
                                            className="w-full bg-[#111] border border-[#222] rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500 transition-colors text-white text-xs"
                                        >
                                            <option value="Bitácora">Bitácora de Campo</option>
                                            <option value="Foto">Registro Fotográfico</option>
                                            <option value="Factura">Factura / Soporte</option>
                                            <option value="Certificado">Certificado Terceros</option>
                                            <option value="Otro">Otro Anexo Técnico</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <CoWorkField 
                                            name={`Evidencias.${index}.Descripcion`}
                                            cowork={cowork}
                                            label="Descripción Corta"
                                            placeholder="Ej: Foto de la muestra 4B..."
                                            onValueChange={(v) => onUpdateItem('Evidencias', index, 'Descripcion', v)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <CoWorkField 
                                        name={`Evidencias.${index}.UrlEvidencia`}
                                        cowork={cowork}
                                        label="URL de Evidencia / Archivo digital"
                                        placeholder="Ej: https://docs.google.com/..."
                                        onValueChange={(v) => onUpdateItem('Evidencias', index, 'UrlEvidencia', v)}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-3 py-2 text-xs text-text-main"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. EJECUCIÓN PRESUPUESTARIA */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">4. Ejecución Presupuestaria de Partidas</h4>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Libro contable y desviaciones financieras en tiempo real</p>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <button 
                            type="button"
                            onClick={handleAddPresupuesto}
                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-yellow-500/10"
                        >
                            <Plus size={12} strokeWidth={3} /> Registrar Gasto
                        </button>
                    )}
                </div>

                {presupuesto.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-[#222] rounded-2xl font-mono text-xs text-text-dim">
                        No hay egresos registrados en este informe.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-border-thin rounded-2xl bg-bg-deep/40">
                        <table className="w-full text-left text-xs font-mono">
                            <thead>
                                <tr className="border-b border-border-thin bg-[#111] text-text-dim text-[9px] uppercase tracking-widest">
                                    <th className="p-4">Descripción del Gasto</th>
                                    <th className="p-4">Rubro</th>
                                    <th className="p-4 w-28">Factura / RUC</th>
                                    <th className="p-4 w-28 text-right">Planificado</th>
                                    <th className="p-4 w-28 text-right">Ejecutado</th>
                                    <th className="p-4 w-28 text-right">Desviación</th>
                                    {!isReadOnly && <th className="p-4 w-12 text-center">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {presupuesto.map((item: any, index: number) => {
                                    const plan = Number(item.Planificado) || 0;
                                    const real = Number(item.Real) || 0;
                                    const dev = real - plan;
                                    
                                    return (
                                        <tr key={index} className="border-b border-[#222] last:border-b-0 hover:bg-surface/10 transition-colors">
                                            <td className="p-3">
                                                <CoWorkField 
                                                    name={`PresupuestoEjecutado.${index}.Descripcion`}
                                                    cowork={cowork}
                                                    placeholder="Ej: Licencias Matlab..."
                                                    onValueChange={(v) => onUpdateItem('PresupuestoEjecutado', index, 'Descripcion', v)}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-text-main focus:ring-0 outline-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <select 
                                                    disabled={isReadOnly}
                                                    value={item.Rubro || 'Equipos'}
                                                    onChange={(e) => onUpdateItem('PresupuestoEjecutado', index, 'Rubro', e.target.value)}
                                                    className="bg-transparent border-none p-0 text-xs text-gray-300 focus:ring-0 outline-none cursor-pointer"
                                                >
                                                    <option value="Equipos">Equipos & Software</option>
                                                    <option value="Materiales">Materiales Fungibles</option>
                                                    <option value="Viajes">Viáticos & Viajes</option>
                                                    <option value="Difusión">Difusión & Publicación</option>
                                                    <option value="Servicios">Servicios Técnicos</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <CoWorkField 
                                                    name={`PresupuestoEjecutado.${index}.Factura`}
                                                    cowork={cowork}
                                                    placeholder="FAC-001-..."
                                                    onValueChange={(v) => onUpdateItem('PresupuestoEjecutado', index, 'Factura', v)}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-text-main focus:ring-0 outline-none"
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <CoWorkField 
                                                    name={`PresupuestoEjecutado.${index}.Planificado`}
                                                    cowork={cowork}
                                                    placeholder="0.00"
                                                    onValueChange={(v) => onUpdateItem('PresupuestoEjecutado', index, 'Planificado', Number(v) || 0)}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-right text-text-main focus:ring-0 outline-none"
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <CoWorkField 
                                                    name={`PresupuestoEjecutado.${index}.Real`}
                                                    cowork={cowork}
                                                    placeholder="0.00"
                                                    onValueChange={(v) => onUpdateItem('PresupuestoEjecutado', index, 'Real', Number(v) || 0)}
                                                    className="w-full bg-transparent border-none p-0 text-xs text-right text-text-main focus:ring-0 outline-none"
                                                />
                                            </td>
                                            <td className={`p-3 text-right font-bold ${dev > 0 ? 'text-red-400' : dev < 0 ? 'text-green-400' : 'text-text-dim'}`}>
                                                ${dev.toFixed(2)}
                                            </td>
                                            {!isReadOnly && (
                                                <td className="p-3 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => onRemove('PresupuestoEjecutado', index)}
                                                        className="p-1 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Ledger Financial Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-bg-deep/40 border border-border-thin">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Presupuesto Planificado</span>
                        <p className="text-xl font-bold font-mono text-text-main">${totalPlanificado.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Ejecución Real Acumulada</span>
                        <p className="text-xl font-bold font-mono text-yellow-500">${totalReal.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Desviación Contable Neto</span>
                        <div className="flex items-center gap-2">
                            <p className={`text-xl font-bold font-mono ${desviacionTotal > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                ${desviacionTotal.toFixed(2)}
                            </p>
                            {desviacionTotal > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold uppercase rounded">
                                    Sobrecosto
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressReportSection;
