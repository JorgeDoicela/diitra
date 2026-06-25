import React from 'react';
import { FileSignature, Clock, Cpu, ShieldCheck } from 'lucide-react';

const Modulos: React.FC = () => {
    return (
        <section id="modulos" className="py-20 lg:-ml-24 lg:-mr-24 space-y-16">
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl">
                Módulos de Automatización.
            </h2>

            {/* Rejilla Bento: Alternancia 8-4 y 4-8 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Módulo A (Postulación - col-span-8) */}
                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Fase_Convocatoria</span>
                    </div>

                    {/* Mockup interactivo interno */}
                    <div className="h-28 border border-border-thin rounded bg-surface/50 p-3.5 font-mono text-[9px] text-text-dim space-y-2 mt-6 select-none opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-center border-b border-border-thin pb-1.5">
                            <span>// PRESUPUESTO PROYECTO</span>
                            <span className="text-brand font-bold font-sans text-[10px]">Total: $4,500.00</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-1.5 border border-border-thin rounded bg-bg-deep">
                                <p className="text-[7px] text-text-dim font-semibold font-mono">01/ EQUIPOS</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$2,100.00</p>
                            </div>
                            <div className="p-1.5 border border-border-thin rounded bg-bg-deep">
                                <p className="text-[7px] text-text-dim font-semibold font-mono">02/ MATERIALES</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$900.00</p>
                            </div>
                            <div className="p-1.5 border border-border-thin rounded bg-bg-deep">
                                <p className="text-[7px] text-text-dim font-semibold font-mono">03/ VINCULACIÓN</p>
                                <p className="text-text-main font-bold mt-0.5 font-sans">$1,500.00</p>
                            </div>
                        </div>
                        <div className="w-full bg-border-thin h-1 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-brand w-[75%]" />
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">
                            Postulación & Peer Review
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Formularios simplificados con Gantt y presupuestos integrados. Asignación automatizada de revisores doble ciego bajo actas firmadas digitalmente.
                        </p>
                    </div>
                </div>

                {/* Módulo B (Seguimiento - col-span-4) */}
                <div className="lg:col-span-4 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <Clock size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Monitoreo_Docente</span>
                    </div>

                    {/* Mockup interactivo interno */}
                    <div className="h-28 border border-border-thin rounded bg-surface/50 p-3.5 font-mono text-[9px] text-text-dim space-y-2.5 mt-6 select-none opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-success font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            <span className="font-semibold text-[10px]">Hito 1: Marco Teórico</span>
                        </div>
                        <div className="flex items-center gap-2 text-success font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            <span className="font-semibold text-[10px]">Hito 2: Diseño de Algoritmo</span>
                        </div>
                        <div className="flex items-center gap-2 text-warning animate-pulse font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                            <span className="font-semibold text-[10px]">Hito 3: Evidencias y Pruebas</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">
                            Seguimiento & Distributivo
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Verificación mensual de horas de investigación mediante carga de evidencias de hito. Control diario de la ejecución presupuestaria del proyecto.
                        </p>
                    </div>
                </div>

                {/* Módulo C (SENADI - col-span-4) */}
                <div className="lg:col-span-4 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Propiedad_Intelectual</span>
                    </div>

                    {/* Mockup interactivo interno */}
                    <div className="h-28 border border-border-thin rounded bg-surface/50 p-3.5 font-mono text-[9px] text-text-dim space-y-2 mt-6 select-none opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep flex justify-between items-center font-sans">
                            <span className="text-[10px] text-text-main font-medium">Certificado_SENADI.pdf</span>
                            <span className="text-brand text-[9px] font-bold font-mono">140 KB</span>
                        </div>
                        <div className="p-2 border border-border-thin rounded bg-bg-deep flex justify-between items-center opacity-65 font-sans">
                            <span className="text-[10px] text-text-main font-medium">Codigo_Fuente.zip</span>
                            <span className="text-brand text-[9px] font-bold font-mono">4.2 MB</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">
                            SENADI & Repositorio
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Gestión del registro de derechos de autor y propiedad intelectual de desarrollos del ISTPET. Integración con DSpace para difusión del conocimiento.
                        </p>
                    </div>
                </div>

                {/* Módulo D (Acreditación - col-span-8) */}
                <div className="lg:col-span-8 bento-card-static p-6 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep">
                            <ShieldCheck size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Evaluación_Externa</span>
                    </div>

                    {/* Mockup interactivo interno */}
                    <div className="h-28 border border-border-thin rounded bg-surface/50 p-3.5 font-mono text-[9px] text-text-dim space-y-2 mt-6 select-none opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-center border-b border-border-thin pb-1.5">
                            <span>// LOG DE EXPORTACIÓN SIIES</span>
                            <span className="text-success font-semibold">CONEXIÓN OK</span>
                        </div>
                        <div className="space-y-1 text-[8px] font-sans">
                            <p className="text-text-main">✓ [14:02:15] Validando Distributivo de Investigadores...</p>
                            <p className="text-text-main">✓ [14:02:16] Evidencias compiladas de Proyectos (12/12)</p>
                            <p className="text-text-main">✓ [14:02:17] Archivo JSON generado y enviado con éxito.</p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main">
                            Acreditación & Reportes
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Automatización de la recopilación de evidencias. Dashboard con el estado del cumplimiento del modelo de evaluación del CACES en tiempo real.
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Modulos;
