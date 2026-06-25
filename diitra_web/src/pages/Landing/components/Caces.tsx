import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Check } from 'lucide-react';

const Caces: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<number>(0);
    const [exportState, setExportState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showToast, setShowToast] = useState<boolean>(false);

    // Mapeo de características a indices de indicadores CACES
    const features = [
        { title: 'Evidencias de avance', desc: 'Consolidación de informes y bitácoras mensuales.' },
        { title: 'Reporte unificado', desc: 'Convenios, ponencias y publicaciones integradas.' },
        { title: 'Horas de distributivo', desc: 'Control automático de carga horaria docente.' },
        { title: 'Compatibilidad SIIES', desc: 'Exportación directa de datos sin reprocesos.' }
    ];

    const handleExport = () => {
        if (exportState !== 'idle') return;
        setExportState('loading');
        
        setTimeout(() => {
            setExportState('success');
            setShowToast(true);
        }, 1200);
    };

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
                setExportState('idle');
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

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
                            {features.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveFeature(idx)}
                                    className={`py-4 border-b border-border-thin flex justify-between items-center w-full text-left transition-all duration-300 hover:pl-2 cursor-pointer ${
                                        activeFeature === idx ? 'pl-2 text-brand font-semibold' : 'text-text-dim'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <span className={`font-mono text-[11px] font-bold tracking-wider uppercase block ${
                                            activeFeature === idx ? 'text-brand' : 'text-text-main'
                                        }`}>{item.title}</span>
                                        <span className="text-[10px] text-text-dim block leading-none">{item.desc}</span>
                                    </div>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider ${
                                        activeFeature === idx ? 'text-brand font-bold' : 'text-text-dim'
                                    }`}>0{idx + 1}</span>
                                </button>
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
                        <div className={`space-y-1.5 transition-all duration-300 p-2 rounded border ${
                            activeFeature === 0 || activeFeature === 1 ? 'border-brand/30 bg-brand-subtle' : 'border-transparent'
                        }`}>
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">I+D+i: Proyectos de Investigación Aplicada</span>
                                <span className="text-success font-semibold font-mono">100% CUMPLIDO</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className={`h-full bg-success w-full ${activeFeature === 0 ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>

                        {/* Indicador 2 */}
                        <div className={`space-y-1.5 transition-all duration-300 p-2 rounded border ${
                            activeFeature === 2 ? 'border-brand/30 bg-brand-subtle' : 'border-transparent'
                        }`}>
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">Vinculación: Proyectos Sociales y Productivos</span>
                                <span className="text-success font-semibold font-mono">85% EXCELENTE</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className={`h-full bg-success w-[85%] ${activeFeature === 2 ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>

                        {/* Indicador 3 */}
                        <div className={`space-y-1.5 transition-all duration-300 p-2 rounded border ${
                            activeFeature === 3 ? 'border-brand/30 bg-brand-subtle' : 'border-transparent'
                        }`}>
                            <div className="flex justify-between text-[10px] font-medium">
                                <span className="text-text-main">Propiedad Intelectual: Patentes y Registros SENADI</span>
                                <span className="text-warning font-semibold font-mono">60% EN PROGRESO</span>
                            </div>
                            <div className="w-full h-1.5 bg-border-thin rounded-full overflow-hidden">
                                <div className={`h-full bg-warning w-[60%] ${activeFeature === 3 ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>
                    </div>

                    {/* Export block */}
                    <div className="mt-6 pt-4 border-t border-border-thin flex justify-between items-center bg-surface/20 p-2.5 rounded border border-border-thin font-sans">
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-brand" />
                            <span className="text-[10px] text-text-main font-semibold font-mono">Reporte_Evidencias_CACES.csv</span>
                        </div>
                        
                        <button 
                            onClick={handleExport}
                            disabled={exportState === 'loading'}
                            className={`px-3 py-1 rounded font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                                exportState === 'loading'
                                    ? 'bg-surface border border-border-thin text-text-dim'
                                    : exportState === 'success'
                                        ? 'bg-success/15 border border-success/30 text-success'
                                        : 'bg-text-main text-bg-deep hover:opacity-90 active:scale-95'
                            }`}
                        >
                            {exportState === 'loading' && <Loader2 size={10} className="animate-spin" />}
                            {exportState === 'success' && <Check size={10} />}
                            {exportState === 'loading' ? 'EXPORTANDO...' : exportState === 'success' ? 'EXPORTADO OK' : 'EXPORTAR SIIES'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Vercel Toast Notification simulation */}
            {showToast && (
                <div className="toast-container-vercel select-none animate-fade-up">
                    <div className="toast-vercel flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
                        <div className="flex-1 font-sans">
                            <h4 className="text-[10px] font-bold text-text-main uppercase tracking-wider font-mono">Exportación Sincronizada</h4>
                            <p className="text-[10px] text-text-dim mt-0.5 leading-tight">Archivo CACES compilado y cargado en el validador SIIES con código de respuesta 200.</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Caces;
