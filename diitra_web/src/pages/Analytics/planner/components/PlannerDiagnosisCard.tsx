import React from 'react';
import type { CacesPlannerDiagnosis } from '../types/cacesPlanner.types';

interface PlannerDiagnosisCardProps {
    diagnosis: CacesPlannerDiagnosis;
}

export const PlannerDiagnosisCard: React.FC<PlannerDiagnosisCardProps> = ({ diagnosis }) => {
    const { formula1, formula2, dictamenGlobal, puntajeEstimadoGlobal, recomendaciones, esModoSimulado } = diagnosis;

    const dictamenConfig = {
        ACREDITABLE: {
            text: 'text-success',
            title: 'Pronóstico Favorable: Acreditable ante CACES',
            description: 'El instituto cumple simultáneamente con la tasa de producción científica por docente (≥ 0.5) y con el porcentaje de pertinencia tecnológica en TRL ≥ 5 (≥ 15%).'
        },
        'EN RIESGO': {
            text: 'text-warning',
            title: 'Pronóstico Observado: En Riesgo de Acreditación',
            description: 'Uno de los dos indicadores oficiales se encuentra por debajo del estándar óptimo o en fase de transición. Requiere plan de mejora inmediato.'
        },
        'NO ACREDITA': {
            text: 'text-error',
            title: 'Pronóstico Desfavorable: No Acredita Criterio I+D+i',
            description: 'Ambos indicadores presentan brechas críticas que impedirían alcanzar el puntaje mínimo de acreditación institucional.'
        }
    }[dictamenGlobal];

    return (
        <div className="bento-card static p-5 md:p-6 rounded-2xl border border-border-thin bg-surface shadow-sm space-y-6">
            {/* Header del Diagnóstico */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-thin/40 pb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-bold tracking-wider uppercase ${dictamenConfig.text}`}>
                            {dictamenGlobal}
                        </span>
                        {esModoSimulado && (
                            <>
                                <span className="text-text-dim text-xs">•</span>
                                <span className="text-[11px] font-mono text-warning">
                                    Simulación Predictiva
                                </span>
                            </>
                        )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-text-main">
                        {dictamenConfig.title}
                    </h3>
                    <p className="text-xs text-text-dim leading-relaxed max-w-3xl">
                        {dictamenConfig.description}
                    </p>
                </div>

                {/* Score Numérico sin recuadro */}
                <div className="text-left md:text-right shrink-0">
                    <span className="text-[9px] font-mono font-medium text-text-dim block uppercase">Puntaje Global Estimado</span>
                    <div className="flex items-baseline md:justify-end gap-1">
                        <span className={`text-3xl font-extrabold font-mono ${dictamenConfig.text}`}>
                            {puntajeEstimadoGlobal}
                        </span>
                        <span className="text-xs text-text-dim font-mono">/ 100 pts</span>
                    </div>
                </div>
            </div>

            {/* Matriz Comparativa de las 2 Fórmulas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fórmula 1 Estado */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-main font-mono">
                            Fórmula 1: Producción Científica
                        </span>
                        <span className={`text-[11px] font-mono font-bold ${
                            formula1.estado === 'CUMPLIDO' ? 'text-success' : formula1.estado === 'EN PROCESO' ? 'text-warning' : 'text-error'
                        }`}>
                            {formula1.porcentajeCumplimiento}% Cumplido
                        </span>
                    </div>
                    <div className="w-full bg-border-thin/40 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                formula1.estado === 'CUMPLIDO' ? 'bg-success' : formula1.estado === 'EN PROCESO' ? 'bg-warning' : 'bg-error'
                            }`}
                            style={{ width: `${Math.min(100, formula1.porcentajeCumplimiento)}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-text-dim font-mono pt-0.5">
                        <span>{formula1.totalProductos} productos / {formula1.metaProductosExigida} meta</span>
                        <span>{formula1.tasaProduccion} pub/docente</span>
                    </div>
                </div>

                {/* Fórmula 2 Estado */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-main font-mono">
                            Fórmula 2: Madurez TRL & Pertinencia
                        </span>
                        <span className={`text-[11px] font-mono font-bold ${
                            formula2.estado === 'CUMPLIDO' ? 'text-success' : formula2.estado === 'EN PROCESO' ? 'text-warning' : 'text-error'
                        }`}>
                            {formula2.porcentajePertinencia}% (Meta: {formula2.umbralMetaPct}%)
                        </span>
                    </div>
                    <div className="w-full bg-border-thin/40 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                formula2.estado === 'CUMPLIDO' ? 'bg-success' : formula2.estado === 'EN PROCESO' ? 'bg-warning' : 'bg-error'
                            }`}
                            style={{ width: `${Math.min(100, (formula2.porcentajePertinencia / formula2.umbralMetaPct) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-text-dim font-mono pt-0.5">
                        <span>{formula2.proyectosCumplenTrl} en TRL≥5 o convenio / {formula2.metaProyectosTrlExigida} meta</span>
                        <span>{formula2.totalProyectos} proyectos totales</span>
                    </div>
                </div>
            </div>

            {/* Lista de Recomendaciones Estratégicas */}
            <div className="space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-main font-mono block">
                    Plan de Acción y Recomendaciones Institucionales
                </span>

                <div className="rounded-xl border border-border-thin bg-surface divide-y divide-border-thin/60 overflow-hidden">
                    {recomendaciones.map((rec, idx) => (
                        <div
                            key={idx}
                            className="p-3 text-xs text-text-main leading-relaxed flex items-start gap-2"
                        >
                            <span className="font-mono text-text-dim text-[11px] font-bold mt-0.5">•</span>
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
