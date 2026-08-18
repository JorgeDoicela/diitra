import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSignature, CheckCircle2, AlertCircle, FileText, Clock } from 'lucide-react';
import WorkspaceActivityPanel from '../WorkspaceActivityPanel';

interface WorkspaceSidebarProps {
    currentProject: {
        linea: string;
        presupuesto: number;
        status: string;
        puedeEditar?: boolean;
        puedeFirmar?: boolean;
        directorProyecto?: string;
        dominio?: string;
        fechaLimiteSubsanacion?: string | null;
        fecha_limite_subsanacion?: string | null;
        [key: string]: any;
    };
    resolvedProjectUuid: string | null;
    setActiveDocument?: (doc: string) => void;
    isAdmin?: boolean;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
    currentProject,
    resolvedProjectUuid,
    setActiveDocument,
    isAdmin = false
}) => {
    const isSigned = currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección';

    return (
        <div className="flex flex-col gap-3">
            {/* Banner de Revisión Técnica para el Administrador */}
            {isAdmin && currentProject.status === 'Enviado' && resolvedProjectUuid && (
                <div className="bento-card static p-5 flex flex-col justify-between border border-brand/40 bg-brand/[0.02] shadow-md animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <Shield size={16} className="text-brand animate-pulse" />
                            <h3 className="text-xs font-black tracking-widest text-brand uppercase">Revisión Técnica Requerida</h3>
                        </div>
                        <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                            Este protocolo ha sido enviado y requiere que el administrador realice la validación técnica e integridad de los datos.
                        </p>
                    </div>
                    <div className="mt-4">
                        <Link
                            to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 btn-vercel-primary text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm no-underline"
                        >
                            <Shield size={12} />
                            <span>Iniciar Revisión Técnica</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Banner de Correcciones Requeridas para el Docente/Investigador */}
            {!isAdmin && currentProject.status === 'En Corrección' && (() => {
                const deadline = currentProject.fechaLimiteSubsanacion || currentProject.fecha_limite_subsanacion;
                let deadlineInfo: { text: string; date: string; colorClass: string } | null = null;
                if (deadline) {
                    let targetDate: Date;
                    if (deadline.includes('/')) {
                        const [d, m, y] = deadline.split('/').map(Number);
                        targetDate = new Date(y, m - 1, d);
                    } else {
                        targetDate = new Date(deadline + (deadline.length === 10 ? 'T00:00:00' : ''));
                    }
                    if (!isNaN(targetDate.getTime())) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        targetDate.setHours(0, 0, 0, 0);
                        const diffTime = targetDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const formattedDate = targetDate.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
                        if (diffDays < 0) {
                            deadlineInfo = {
                                text: `Plazo Vencido (${Math.abs(diffDays)}d)`,
                                date: formattedDate,
                                colorClass: 'text-red-500 bg-red-500/10 border-red-500/20'
                            };
                        } else if (diffDays <= 3) {
                            deadlineInfo = {
                                text: diffDays === 0 ? 'Vence hoy' : diffDays === 1 ? 'Vence mañana' : `Vence en ${diffDays}d`,
                                date: formattedDate,
                                colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse'
                            };
                        } else {
                            deadlineInfo = {
                                text: `Plazo: ${diffDays} días restantes`,
                                date: formattedDate,
                                colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                            };
                        }
                    }
                }

                return (
                    <div className="bento-card static p-5 flex flex-col justify-between border border-amber-500/40 bg-amber-500/[0.02] shadow-md animate-fade-in relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <AlertCircle size={16} className="text-amber-500 animate-pulse" />
                                <h3 className="text-xs font-black tracking-widest text-amber-500 uppercase">Correcciones Requeridas</h3>
                            </div>
                            <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                                El administrador ha retornado el proyecto con observaciones técnicas que deben ser atendidas en su protocolo.
                            </p>
                            {deadlineInfo && (
                                <div className={`mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold ${deadlineInfo.colorClass}`}>
                                    <div className="flex items-center gap-1">
                                        <Clock size={11} className="shrink-0" />
                                        <span>{deadlineInfo.text}</span>
                                    </div>
                                    <span className="opacity-80 font-normal">{deadlineInfo.date}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (setActiveDocument) setActiveDocument('PROTOCOLO_INVESTIGACION');
                                }}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 btn-vercel-primary text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm !bg-amber-500 hover:!bg-amber-600 !text-white"
                            >
                                <FileText size={12} />
                                <span>Atender Observaciones</span>
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Firmas */}
            <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-text-main/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-text-main/8 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <Shield size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Firmas del Protocolo</h3>
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                        Estado de validez y firmas electrónicas del protocolo institucional.
                    </p>
                </div>
                <div className="mt-5">
                    {/* Tarjeta del firmante (Director) */}
                    <div className="p-3.5 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all mb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Director de Proyecto</p>
                                <p className="text-xs font-semibold text-text-main">
                                    {currentProject.directorProyecto || 'No asignado'}
                                </p>
                            </div>
                            {isSigned ? (
                                <span className="text-emerald-500/80 p-1" title="Firma electrónica válida">
                                    <CheckCircle2 size={16} />
                                </span>
                            ) : (
                                <span className="text-[9px] font-semibold text-warning flex items-center gap-1">
                                    <span className="dot dot-warning dot-pulse" />
                                    Pendiente
                                </span>
                            )}
                        </div>
                        {isSigned && (
                            <div className="mt-2 pt-2 border-t border-border-thin/40 flex items-center justify-between">
                                <span className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 size={10} />
                                    Firmado Electrónicamente
                                </span>
                            </div>
                        )}
                        {!isSigned && !currentProject.puedeFirmar && (
                            <div className="mt-2.5 pt-2 border-t border-border-thin/40">
                                <p className="text-[9px] text-text-dim leading-relaxed">
                                    Esperando la firma electrónica del Director de Proyecto para avanzar a la fase de Evaluación.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botón de acción principal */}
                    {!isSigned && currentProject.puedeFirmar && setActiveDocument && (
                        <button
                            type="button"
                            onClick={() => setActiveDocument('PROTOCOLO_INVESTIGACION')}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-text-main hover:bg-text-main/90 text-bg-deep text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer mb-1"
                        >
                            <FileSignature size={12} />
                            <span>Ir a Firmar Documento</span>
                        </button>
                    )}
                </div>
            </div>



            {/* Panel de Actividad Reciente */}
            {resolvedProjectUuid && (
                <div className="bento-card static flex flex-col overflow-hidden">
                    <WorkspaceActivityPanel
                        projectUuid={resolvedProjectUuid}
                    />
                </div>
            )}
        </div>
    );
};

export default WorkspaceSidebar;
