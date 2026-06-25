import React from 'react';
import { FileSignature, Clock, Cpu, ShieldCheck, ChevronRight } from 'lucide-react';

const Modulos: React.FC = () => {
    return (
        <section id="modulos" className="space-y-12 lg:-ml-24 lg:-mr-24">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter text-text-main">Módulos de Automatización</h2>
                <div className="h-[2px] w-12 bg-text-main" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* A: Proyectos */}
                <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                            <FileSignature size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Fase_Convocatoria</span>
                    </div>
                    <div className="mt-12 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                            Postulación & Peer Review
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Formularios simplificados con Gantt y presupuestos integrados. Asignación automatizada de revisores doble ciego bajo actas firmadas digitalmente.
                        </p>
                    </div>
                </div>

                {/* B: Seguimiento */}
                <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                            <Clock size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Monitoreo_Docente</span>
                    </div>
                    <div className="mt-12 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                            Seguimiento & Distributivo
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Verificación mensual de horas de investigación mediante carga de evidencias de hito. Control diario de la ejecución presupuestaria del proyecto.
                        </p>
                    </div>
                </div>

                {/* C: Innovacion */}
                <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                            <Cpu size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Propiedad_Intelectual</span>
                    </div>
                    <div className="mt-12 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                            SENADI & Repositorio
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-[11px] text-text-dim leading-relaxed">
                            Gestión del registro de derechos de autor y propiedad intelectual de desarrollos del ISTPET. Integración con DSpace para difusión del conocimiento.
                        </p>
                    </div>
                </div>

                {/* D: Calidad */}
                <div className="md:col-span-2 bento-card p-6 flex flex-col justify-between hover:border-text-main transition-all group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className="p-2 border border-border-thin rounded bg-bg-deep group-hover:border-text-main transition-colors">
                            <ShieldCheck size={18} strokeWidth={1.5} className="text-text-main" />
                        </div>
                        <span className="text-[9px] font-mono text-text-dim px-2 py-0.5 border border-border-thin rounded-full uppercase">Evaluación_Externa</span>
                    </div>
                    <div className="mt-12 space-y-2">
                        <h4 className="text-base font-semibold tracking-tight text-text-main flex items-center gap-1">
                            Acreditación & Reportes
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
