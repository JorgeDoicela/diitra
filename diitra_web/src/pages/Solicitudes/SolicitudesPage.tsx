import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Inbox, 
    ArrowRight
} from 'lucide-react';
import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../api/AuthContext';

export const SolicitudesPage: React.FC = () => {
    const { user, isEstudiante } = useAuth();

    const rawNombre = user?.nombre_completo?.trim().split(' ')[0] || user?.usuario || '';
    const primerNombre = rawNombre ? (rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1).toLowerCase()) : '';

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10">
            <PageHeader
                kicker="Gestión Institucional"
                icon={Inbox}
                title="Centro de Solicitudes"
                description="Gestione, consulte y dé seguimiento a sus solicitudes, avales, reasignaciones e incidencias institucionales."
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
                {/* Tarjeta 1: Grupos de Investigación / Semilleros */}
                <Link
                    to="/grupos"
                    className="bento-card static p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-text-dim/40 transition-colors duration-200 group cursor-pointer no-underline text-inherit block"
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-text-main group-hover:text-brand transition-colors">
                                {isEstudiante ? 'Grupos y Semilleros' : 'Grupos de Investigación'}
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                {isEstudiante 
                                    ? `${primerNombre ? `Hola ${primerNombre}. ` : ''}Como estudiante participas en semilleros cuando un docente coordinador te incorpora a su equipo; no se postulan grupos autónomos.`
                                    : 'Conformación, colectivos, semilleros y avales para líneas de vinculación y desarrollo tecnológico.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 group-hover:opacity-95 transition-opacity">
                            <span>{isEstudiante ? 'Ver Grupos y Semilleros' : 'Administrar y Proponer Grupos'}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Tarjeta 2: Adopción de Proyectos (Solo Docentes e Investigadores) */}
                {!isEstudiante && (
                    <Link
                        to="/investigacion/adopcion"
                        className="bento-card p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-text-dim/40 transition-colors duration-200 group cursor-pointer no-underline text-inherit block"
                    >
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-base font-semibold text-text-main group-hover:text-amber-500 transition-colors">
                                    Adopción de Proyectos
                                </h3>
                                <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                    Rescate, reanudación y continuidad de proyectos de investigación e innovación inconclusos o disponibles para adopción.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 group-hover:opacity-95 transition-opacity">
                                <span>Ver Proyectos para Adopción</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                )}

                {/* Tarjeta 3: Buzón de Incidencias */}
                <Link
                    to="/incidencias"
                    className="bento-card p-6 flex flex-col justify-between rounded-xl border border-border-thin bg-surface hover:border-text-dim/40 transition-colors duration-200 group cursor-pointer no-underline text-inherit block"
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold text-text-main group-hover:text-brand transition-colors">
                                Buzón de Incidencias
                            </h3>
                            <p className="text-xs text-text-dim leading-relaxed mt-1.5">
                                Canal directo para reportar fallos, inconsistencias de datos, bloqueos de pantalla o solicitar asistencia técnica.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="btn-brand w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-5 group-hover:opacity-95 transition-opacity">
                            <span>Ir a Buzón de Incidencias</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>
        </main>
    );
};

export default SolicitudesPage;
