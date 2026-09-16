import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Inbox, 
    ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/Common/PageHeader';

export const SolicitudesPage: React.FC = () => {
    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10">
            <PageHeader
                kicker="Gestión Institucional"
                icon={Inbox}
                title="Centro de Solicitudes"
                description="Gestione, consulte y dé seguimiento a sus solicitudes, avales, reasignaciones e incidencias institucionales."
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
                {/* Tarjeta 1: Grupos de Investigación */}
                <div className="bento-card p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-border-accent/40 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
                            <span className="badge-vercel-green text-[11px] py-0.5 px-2 font-medium">
                                Convocatoria Abierta
                            </span>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-text-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Grupos de Investigación
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                Conformación, propuestas de nuevos colectivos, semilleros y avales para líneas de vinculación y desarrollo tecnológico.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-text-dim font-mono">
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Docentes
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Estudiantes
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Semilleros
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-thin">
                        <Link
                            to="/grupos"
                            className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 no-underline"
                        >
                            <span>Administrar y Proponer Grupos</span>
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Tarjeta 2: Adopción de Proyectos */}
                <div className="bento-card p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-border-accent/40 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
                            <span className="badge-vercel-amber text-[11px] py-0.5 px-2 font-medium">
                                Reasignación I+D
                            </span>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-text-main group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                Adopción de Proyectos
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                Rescate, reanudación y continuidad de proyectos de investigación e innovación inconclusos o disponibles para adopción.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-text-dim font-mono">
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Investigación
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Reasignación
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Continuidad
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-thin">
                        <Link
                            to="/investigacion/adopcion"
                            className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 no-underline"
                        >
                            <span>Ver Proyectos para Adopción</span>
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Tarjeta 3: Buzón de Incidencias */}
                <div className="bento-card p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-border-accent/40 transition-all duration-200 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
                            <span className="badge-vercel-neutral text-[11px] py-0.5 px-2 font-medium">
                                Soporte y Ayuda
                            </span>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-text-main group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                Buzón de Incidencias
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                Canal directo para reportar fallos, inconsistencias de datos, bloqueos de pantalla o solicitar asistencia técnica.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-text-dim font-mono">
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Soporte
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Asistencia
                            </span>
                            <span className="px-2 py-0.5 rounded bg-surface-hover/80 border border-border-thin">
                                Reportes
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-thin">
                        <Link
                            to="/incidencias"
                            className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 no-underline"
                        >
                            <span>Ir a Buzón de Incidencias</span>
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SolicitudesPage;
