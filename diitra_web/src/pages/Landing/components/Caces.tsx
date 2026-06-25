import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';

const Caces: React.FC = () => {
    return (
        <section id="caces" className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-12 items-center lg:-ml-24 lg:-mr-24">

            {/* Izquierda: Mockup en HTML/CSS de Indicadores CACES */}
            <div className="lg:col-span-7 order-last lg:order-first border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm group hover:border-border-hover transition-all duration-300">
                {/* Decoraciones del panel */}
                <div className="flex items-center justify-between border-b border-border-thin pb-3 mb-4">
                    <span className="text-[10px] font-semibold text-text-main">// PANEL INDICADORES CACES (SIIES)</span>
                    <span className="text-[9px] text-text-dim">AÑO DE EVALUACIÓN: 2026</span>
                </div>

                {/* Indicadores listados */}
                <div className="space-y-4">
                    {/* Indicador 1 */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-text-main">I+D+i: Proyectos de Investigación Aplicada</span>
                            <span className="text-success font-semibold">100% CUMPLIDO</span>
                        </div>
                        <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                            <div className="h-full bg-success w-full" />
                        </div>
                    </div>

                    {/* Indicador 2 */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-text-main">Vinculación: Proyectos Sociales y Productivos</span>
                            <span className="text-success font-semibold">85% EXCELENTE</span>
                        </div>
                        <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                            <div className="h-full bg-success w-[85%]" />
                        </div>
                    </div>

                    {/* Indicador 3 */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-text-main">Propiedad Intelectual: Patentes y Registros SENADI</span>
                            <span className="text-warning font-semibold">60% EN PROGRESO</span>
                        </div>
                        <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                            <div className="h-full bg-warning w-[60%]" />
                        </div>
                    </div>
                </div>

                {/* Export block */}
                <div className="mt-6 pt-4 border-t border-border-thin flex justify-between items-center bg-surface/20 p-2.5 rounded border border-border-thin">
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-brand" />
                        <span className="text-[10px] text-text-main font-semibold">Reporte_Evidencias_CACES.csv</span>
                    </div>
                    <button className="px-3 py-1 rounded bg-text-main text-bg-deep font-semibold text-[9px] hover:opacity-90 active:scale-95 transition-all">
                        EXPORTAR SIIES
                    </button>
                </div>
            </div>

            {/* Derecha: Título y descripción */}
            <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-dim uppercase tracking-wider">
                    <span>02 / Evaluación de Calidad</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-[0.95] text-text-main">
                    Diseñado para superar la auditoría CACES.
                </h2>
                <p className="text-xs text-text-dim leading-relaxed font-medium">
                    El sistema genera automáticamente la documentación de soporte exigida por los evaluadores en el Modelo de Acreditación de Institutos. Exporta reportes listos en formato compatible con el SIIES.
                </p>
                <div className="space-y-3 pt-2">
                    {[
                        'Consolidación de evidencias de avance mensuales.',
                        'Control de horas del distributivo docente.',
                        'Reporte unificado de convenios y productos de desarrollo.'
                    ].map((text, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-[11px] text-text-dim">
                            <CheckCircle2 size={13} className="text-text-main mt-0.5" />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
};

export default Caces;
