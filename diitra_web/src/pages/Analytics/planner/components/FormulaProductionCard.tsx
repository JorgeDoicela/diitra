import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { CacesFormula1Result, CacesPlannerSimulationParams } from '../types/cacesPlanner.types';

interface FormulaProductionCardProps {
    f1: CacesFormula1Result;
    params: CacesPlannerSimulationParams;
    onUpdateProduct: (
        type: 'extraArticulosScopus' | 'extraArticulosLatindex' | 'extraLibros' | 'extraPonencias' | 'extraPrototipos',
        deltaOrValue: number,
        isDelta?: boolean
    ) => void;
    onSetInvestigadoresOverride: (val: number | null) => void;
}

export const FormulaProductionCard: React.FC<FormulaProductionCardProps> = ({
    f1,
    params,
    onUpdateProduct,
    onSetInvestigadoresOverride
}) => {
    // Estado local para el input de docentes: evita rebote al borrar/escribir parcialmente
    const [docentesInputVal, setDocentesInputVal] = useState<string>(String(f1.totalInvestigadores));
    const statusConfig = {
        CUMPLIDO: {
            badge: 'badge-vercel-success',
            text: 'text-success',
            border: 'border-success/30',
            bg: 'bg-success/5',
            label: 'Cumple Estándar'
        },
        'EN PROCESO': {
            badge: 'badge-vercel-warning',
            text: 'text-warning',
            border: 'border-warning/30',
            bg: 'bg-warning/5',
            label: 'En Progreso (Cercano a Meta)'
        },
        ALERTA: {
            badge: 'badge-vercel-error',
            text: 'text-error',
            border: 'border-error/30',
            bg: 'bg-error/5',
            label: 'En Riesgo de No Acreditar'
        }
    }[f1.estado];

    return (
        <div className="bento-card static p-5 md:p-6 bg-surface border border-border-thin rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
                {/* Encabezado de la Fórmula */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin/50 pb-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
                                Fórmula Oficial CACES #1
                            </span>
                            <span className="text-text-dim text-xs">•</span>
                            <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${statusConfig.text}`}>
                                {f1.estado}
                            </span>
                        </div>
                        <h3 className="text-base font-semibold text-text-main">
                            Tasa de Producción Científica (T<sub>prod</sub>)
                        </h3>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                        <span className="text-[9px] font-medium text-text-dim block uppercase font-mono">Cumplimiento</span>
                        <span className={`text-xl font-bold font-mono ${statusConfig.text}`}>
                            {f1.porcentajeCumplimiento}%
                        </span>
                    </div>
                </div>

                {/* Expresión Matemática Visual */}
                <div className="p-3.5 bg-bg-deep/40 border border-border-thin/60 rounded-xl space-y-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-wider text-text-dim block">
                        Definición de Indicador Cuantitativo CACES para ISTT:
                    </span>
                    <div className="flex flex-col gap-2">
                        {/* Fracción de la fórmula */}
                        <div className="flex items-center justify-center p-3 bg-surface/80 rounded-lg border border-border-thin text-center overflow-x-auto">
                            <div className="font-mono text-xs sm:text-sm text-text-main font-semibold flex items-center gap-2">
                                <span>T<sub>prod</sub> =</span>
                                <div className="inline-flex flex-col items-center">
                                    <span className="border-b border-text-main/60 px-2 pb-0.5">
                                        Total Productos ({f1.totalProductos})
                                    </span>
                                    <span className="pt-0.5 text-text-dim text-[11px]">
                                        Docentes Investigadores ({f1.totalInvestigadores})
                                    </span>
                                </div>
                                <span className="text-brand font-bold">= {f1.tasaProduccion} pub/docente</span>
                            </div>
                        </div>
                        {/* Umbral CACES — es la meta de comparación, NO parte del denominador */}
                        <div className="flex items-center justify-center gap-2 text-[10.5px] font-mono text-text-dim">
                            <span>Umbral CACES (ISTT): T<sub>prod</sub></span>
                            <span className="font-bold text-brand">≥ 0.5</span>
                            <span>publicaciones / docente investigador</span>
                        </div>
                    </div>
                </div>

                {/* Resumen de Métricas Clave */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2 border-y border-border-thin/40">
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Docentes I+D</span>
                        <span className="text-base font-bold font-mono text-text-main">{f1.totalInvestigadores}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Meta CACES (0.5)</span>
                        <span className="text-base font-bold font-mono text-brand">{f1.metaProductosExigida} prods</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Total Productos</span>
                        <span className="text-base font-bold font-mono text-text-main">{f1.totalProductos}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Brecha CACES</span>
                        <span className={`text-base font-bold font-mono ${f1.brechaFaltante === 0 ? 'text-success' : 'text-error'}`}>
                            {f1.brechaFaltante === 0 ? 'Cubierta' : `Faltan ${f1.brechaFaltante}`}
                        </span>
                    </div>
                </div>

                {/* Notificación de Brecha */}
                <p className={`text-xs leading-relaxed font-normal ${statusConfig.text}`}>
                    {f1.brechaFaltante > 0 
                        ? `Para cumplir el 100% ante los pares evaluadores del CACES, el instituto necesita certificar al menos ${f1.brechaFaltante} publicación(es) adicional(es) en este período.`
                        : `El instituto cumple holgadamente la meta CACES con un superávit de ${f1.totalProductos - f1.metaProductosExigida} producto(s) sobre el umbral mínimo.`}
                </p>

                {/* Simulador Interactivo "What-If" */}
                <div className="p-4 bg-surface/80 border border-brand/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-main uppercase tracking-wider font-mono">
                            Simular Escenarios de Publicación
                        </span>
                        <span className="text-[10px] text-text-dim font-mono">
                            Modifica valores para predecir cumplimiento
                        </span>
                    </div>

                    {/* Override de Docentes Investigadores */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-bg-deep/40 rounded-lg border border-border-thin">
                        <label htmlFor="planner-docentes-input" className="text-xs text-text-main font-medium">
                            Planta de Docentes con horas de Investigación:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="planner-docentes-input"
                                type="number"
                                min="1"
                                max="500"
                                value={docentesInputVal}
                                onChange={(e) => {
                                    setDocentesInputVal(e.target.value);
                                    const val = parseInt(e.target.value, 10);
                                    onSetInvestigadoresOverride(isNaN(val) || val < 1 ? null : val);
                                }}
                                onBlur={() => {
                                    // Al perder el foco, normalizamos al valor efectivo
                                    setDocentesInputVal(String(f1.totalInvestigadores));
                                }}
                                className="w-20 px-2 py-1 text-xs font-mono font-bold text-center bg-surface border border-border-thin rounded-md focus:border-brand focus:outline-none"
                            />
                            {params.investigadoresOverride !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSetInvestigadoresOverride(null);
                                        setDocentesInputVal(String(f1.totalInvestigadores));
                                    }}
                                    className="text-[10px] text-brand hover:underline font-mono"
                                >
                                    Restablecer
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Fila de Productos Simulados Adicionales */}
                    <div className="space-y-2">
                        <span className="text-[11px] font-medium text-text-dim block">
                            Proyectar Publicaciones adicionales a ingresar en el período:
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Scopus / WoS */}
                            <div className="flex items-center justify-between p-2 bg-surface border border-border-thin rounded-lg">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-text-main block">Artículos Scopus / WoS</span>
                                    <span className="text-[9px] text-text-dim">Revisión por pares indexada</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraArticulosScopus', -1, true)}
                                        disabled={params.extraArticulosScopus <= 0}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main disabled:opacity-30 cursor-pointer"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-7 text-center font-mono text-xs font-bold text-brand">
                                        +{params.extraArticulosScopus}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraArticulosScopus', 1, true)}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>

                            {/* Latindex Catálogo 2.0 */}
                            <div className="flex items-center justify-between p-2 bg-surface border border-border-thin rounded-lg">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-text-main block">Artículos Latindex 2.0</span>
                                    <span className="text-[9px] text-text-dim">Revistas regionales acreditadas</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraArticulosLatindex', -1, true)}
                                        disabled={params.extraArticulosLatindex <= 0}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main disabled:opacity-30 cursor-pointer"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-7 text-center font-mono text-xs font-bold text-brand">
                                        +{params.extraArticulosLatindex}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraArticulosLatindex', 1, true)}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>

                            {/* Libros / Capítulos */}
                            <div className="flex items-center justify-between p-2 bg-surface border border-border-thin rounded-lg">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-text-main block">Libros y Capítulos</span>
                                    <span className="text-[9px] text-text-dim">Con ISBN y evaluación ciega</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraLibros', -1, true)}
                                        disabled={params.extraLibros <= 0}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main disabled:opacity-30 cursor-pointer"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-7 text-center font-mono text-xs font-bold text-brand">
                                        +{params.extraLibros}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraLibros', 1, true)}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>

                            {/* Ponencias / Memorias */}
                            <div className="flex items-center justify-between p-2 bg-surface border border-border-thin rounded-lg">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-medium text-text-main block">Ponencias en Congresos</span>
                                    <span className="text-[9px] text-text-dim">Con actas indexadas con ISSN/ISBN</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraPonencias', -1, true)}
                                        disabled={params.extraPonencias <= 0}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main disabled:opacity-30 cursor-pointer"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-7 text-center font-mono text-xs font-bold text-brand">
                                        +{params.extraPonencias}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateProduct('extraPonencias', 1, true)}
                                        className="w-6 h-6 rounded bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
