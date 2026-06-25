import React from 'react';
import { FileText } from 'lucide-react';

const Caces: React.FC = () => {
    return (
        <section id="caces" className="py-20 lg:-ml-24 lg:-mr-24">
            {/* Título superior alineado a la derecha estilo Vercel */}
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl mb-16 lg:ml-auto text-left lg:text-right">
                Diseñado para superar <br className="hidden md:inline" /> la auditoría CACES.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                {/* Izquierda (col-span-5): Párrafo descriptivo y menú de características */}
                <div className="lg:col-span-5 order-last lg:order-first space-y-8">
                    <p className="text-xs text-text-dim leading-relaxed font-medium">
                        El sistema genera automáticamente la documentación de soporte exigida por los evaluadores en el Modelo de Acreditación de Institutos. Exporta reportes listos en formato compatible con el SIIES.
                    </p>

                    <div className="space-y-4">
                        <span className="font-mono text-[10px] text-text-dim/80 uppercase tracking-[0.2em] font-semibold block">// Características</span>
                        <div className="flex flex-col border-t border-border-thin divide-y divide-border-thin">
                            {[
                                { title: 'Evidencias de avance', desc: 'Consolidación de informes y bitácoras mensuales.' },
                                { title: 'Reporte unificado', desc: 'Convenios, ponencias y publicaciones integradas.' },
                                { title: 'Horas de distributivo', desc: 'Control automático de carga horaria docente.' },
                                { title: 'Compatibilidad SIIES', desc: 'Exportación directa de datos sin reprocesos.' }
                            ].map((item, idx) => (
                                <div key={idx} className="py-4 border-b border-border-thin flex justify-between items-center select-none">
                                    <div className="space-y-1">
                                        <span className="font-mono text-[11px] text-text-main font-bold tracking-wider uppercase block">{item.title}</span>
                                        <span className="text-[10px] text-text-dim block leading-none">{item.desc}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">0{idx + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Derecha (col-span-7): Mockup en HTML/CSS de Indicadores CACES */}
                <div className="lg:col-span-7 border border-border-thin rounded-xl bg-surface/35 shadow-xl p-6 font-mono text-[11px] tracking-tight relative overflow-hidden backdrop-blur-sm select-none">
                    {/* Decoraciones del panel */}
                    <div className="flex items-center justify-between border-b border-border-thin pb-4 mb-5">
                        <span className="text-[10px] font-semibold text-text-main font-mono">// PANEL INDICADORES CACES (SIIES)</span>
                        <span className="text-[9px] text-text-dim font-mono">AÑO DE EVALUACIÓN: 2026</span>
                    </div>

                    {/* Indicadores listados */}
                    <div className="space-y-4 font-sans">
                        {/* Indicador 1 */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">I+D+i: Proyectos de Investigación Aplicada</span>
                                <span className="text-success font-semibold font-mono">100% CUMPLIDO</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-success w-full" />
                            </div>
                        </div>

                        {/* Indicador 2 */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">Vinculación: Proyectos Sociales y Productivos</span>
                                <span className="text-success font-semibold font-mono">85% EXCELENTE</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-success w-[85%]" />
                            </div>
                        </div>

                        {/* Indicador 3 */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">Propiedad Intelectual: Patentes y Registros SENADI</span>
                                <span className="text-warning font-semibold font-mono">60% EN PROGRESO</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-warning w-[60%]" />
                            </div>
                        </div>
                    </div>

                    {/* Export block */}
                    <div className="mt-6 pt-4 border-t border-border-thin flex justify-between items-center bg-surface/20 p-2.5 rounded border border-border-thin font-sans">
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-brand" />
                            <span className="text-[10px] text-text-main font-semibold font-mono">Reporte_Evidencias_CACES.csv</span>
                        </div>
                        <button className="px-3 py-1 rounded bg-text-main text-bg-deep font-bold text-[9px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                            EXPORTAR SIIES
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Caces;
