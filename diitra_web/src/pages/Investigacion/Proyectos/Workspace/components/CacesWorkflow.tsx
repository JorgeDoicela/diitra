import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Settings, CheckCircle2, FileText, FileSignature, CheckSquare, 
    AlertCircle, BarChart, Activity, Shield, FileCheck
} from 'lucide-react';
import { buildWorkspacePath, templateCodeToEditParam } from '../../../../../core/documents/templateUrl';

const WorkflowPhases = [
    { id: 'Borrador', label: 'Formulación', icon: FileText },
    { id: 'Enviado', label: 'Revisión Administrador', icon: Shield },
    { id: 'En Revisión', label: 'Evaluación Pares', icon: CheckCircle2 },
    { id: 'Aprobado', label: 'Aprobación Legal', icon: FileSignature },
    { id: 'En Ejecución', label: 'Ejecución y Avance', icon: Settings },
    { id: 'Finalizado', label: 'Informe Final', icon: FileCheck },
];

const getPhaseIndex = (status: string) => {
    if (status === 'Borrador' || status === 'En Corrección') return 0;
    if (status === 'Enviado') return 1;
    if (status === 'En Revisión') return 2;
    if (status === 'Aprobado') return 3;
    if (status === 'En Ejecución') return 4;
    if (status === 'Finalizado') return 5;
    return -1;
};

interface CacesWorkflowProps {
    currentProject: {
        status: string;
        puedeEditar: boolean;
        puntajeEvaluacion: number | null;
        codigoInstitucional: string | null;
        uuid: string;
    };
    templateCode: string;
    assignedRevisionUuid: string | null;
    assignedRevisionStatus: string | null;
    isAdmin: boolean;
    iniciandoEjecucion: boolean;
    resolvingDocument: string | null;
    urlPrefix: string;
    resolvedProjectUuid: string;
    setActiveDocument: (doc: string) => void;
    resolveDocumentInstance: (doc: string) => void;
    handleIniciarEjecucion: () => void;
    navigate: (path: string) => void;
}

export const CacesWorkflow: React.FC<CacesWorkflowProps> = ({
    currentProject,
    templateCode,
    assignedRevisionUuid,
    assignedRevisionStatus,
    isAdmin,
    iniciandoEjecucion,
    resolvingDocument,
    urlPrefix,
    resolvedProjectUuid,
    setActiveDocument,
    resolveDocumentInstance,
    handleIniciarEjecucion,
    navigate
}) => {
    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            <div className="flex items-center gap-2.5 mb-2">
                <Settings size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Flujo Institucional CACES</h3>
            </div>
            
            <div className="relative pl-8 space-y-4 mt-6">
                {/* Track line */}
                <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-border-thin"></div>
                
                {WorkflowPhases.map((phase, idx) => {
                    const currentIdx = getPhaseIndex(currentProject.status);
                    const isCurrent = currentIdx === idx;
                    const isPast = currentIdx > idx;
                    const isFuture = idx > currentIdx;
                    
                    const isRevisionDone = phase.id === 'En Revisión' && assignedRevisionStatus === 'Completada';
                    const showChecked = isPast || isRevisionDone;
                    const isCurrentActive = isCurrent && !isRevisionDone;

                    return (
                        <div key={phase.id} className="relative group/step">
                            {/* Connector segment colored green if past */}
                            {idx < WorkflowPhases.length - 1 && (
                                <div className={`absolute left-[-20px] top-9 bottom-[-20px] w-0.5 transition-colors duration-300 z-0 ${
                                    isPast ? 'bg-success/50' : 'bg-border-thin'
                                }`} />
                            )}

                            {/* Step Dot */}
                            <div className={`absolute -left-[38px] top-0.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                                showChecked 
                                    ? 'bg-success/15 border-success text-success' 
                                    : isCurrentActive 
                                        ? 'bg-text-main border-text-main text-bg-deep ring-4 ring-text-main/10 shadow-[0_0_12px_rgba(0,0,0,0.08)] animate-pulse' 
                                        : (phase.id === 'Finalizado' && currentProject.status === 'En Ejecución')
                                            ? 'bg-surface border-text-dim/40 text-text-main'
                                            : 'bg-surface border-border-thin text-text-dim'
                            }`}>
                                {showChecked ? (
                                    <CheckCircle2 size={16} className="stroke-[2.5]" />
                                ) : (
                                    <span className="text-xs font-bold font-mono">{idx + 1}</span>
                                )}
                            </div>
                            
                            {/* Card Content */}
                            <div 
                                onClick={() => {
                                    if (phase.id === 'Borrador' && (isCurrent || isPast)) {
                                        if (templateCode === 'PROTOCOLO_INVESTIGACION') {
                                            setActiveDocument('PROTOCOLO_INVESTIGACION');
                                        } else {
                                            resolveDocumentInstance('PROTOCOLO_INVESTIGACION');
                                        }
                                    } else if (phase.id === 'Enviado' && (isCurrent || isPast)) {
                                        if (isAdmin) {
                                            navigate(`/investigacion/revision-tecnica/${resolvedProjectUuid}`);
                                        } else {
                                            if (templateCode === 'PROTOCOLO_INVESTIGACION') {
                                                setActiveDocument('PROTOCOLO_INVESTIGACION');
                                            } else {
                                                resolveDocumentInstance('PROTOCOLO_INVESTIGACION');
                                            }
                                        }
                                    } else if (phase.id === 'En Revisión' && isCurrentActive) {
                                        if (assignedRevisionUuid) {
                                            navigate(`/revisiones/${assignedRevisionUuid}`);
                                        } else if (isAdmin) {
                                            navigate(`/evaluacion-pares/proyecto/${resolvedProjectUuid}`);
                                        }
                                    } else if (phase.id === 'Aprobado' && isCurrentActive && currentProject.status === 'Aprobado' && isAdmin && !iniciandoEjecucion) {
                                        handleIniciarEjecucion();
                                    } else if (phase.id === 'Finalizado' && (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado')) {
                                        navigate(buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('INFORME_FINAL_INVESTIGACION')}`, urlPrefix));
                                    }
                                }}
                                className={`p-4 rounded-xl border transition-all duration-300 ${
                                    isCurrentActive 
                                        ? 'bg-surface-hover/50 border-text-dim/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] cursor-pointer hover:border-text-main/40 hover:bg-surface-hover/80' 
                                        : (((phase.id === 'Borrador' || phase.id === 'Enviado') && isPast) || (phase.id === 'Finalizado' && currentProject.status === 'En Ejecución'))
                                            ? 'bg-surface/30 border-border-thin cursor-pointer hover:border-text-main/30 hover:bg-surface-hover/40'
                                            : isFuture
                                                ? 'bg-transparent border-transparent opacity-40 select-none'
                                                : 'bg-transparent border-transparent hover:border-border-thin/40 hover:bg-surface-hover/10'
                                }`}
                            >
                                <h3 className={`text-xs font-semibold tracking-wider uppercase ${isCurrentActive || (phase.id === 'Finalizado' && currentProject.status === 'En Ejecución') ? 'text-text-main font-bold' : 'text-text-dim'}`}>
                                    {phase.label}
                                </h3>
                                <p className="text-[11px] text-text-dim mt-1.5 leading-relaxed">
                                    {phase.id === 'Borrador' && 'Construcción colaborativa del protocolo de investigación por parte del equipo.'}
                                    {phase.id === 'Enviado' && (
                                        isAdmin 
                                            ? 'Revisión de requisitos CACES, carga horaria, firmas y presupuesto.'
                                            : currentProject.status === 'En Corrección'
                                                ? 'El Administrador ha solicitado correcciones puntuales en su protocolo antes de la evaluación.'
                                                : 'El proyecto está siendo revisado técnicamente por el administrador.'
                                    )}
                                    {phase.id === 'En Revisión' && 'Revisión técnica anónima por pares evaluadores asignados por el Director.'}
                                    {phase.id === 'Aprobado' && 'Validación final del consejo académico y firma electrónica de actas formales.'}
                                    {phase.id === 'En Ejecución' && 'Seguimiento de hitos, envío de informes de avance y ejecución presupuestaria.'}
                                    {phase.id === 'Finalizado' && 'Elaboración, consolidación de resultados y presentación del informe final de investigación.'}
                                </p>
                                
                                {phase.id === 'Borrador' && (
                                    <div className="mt-4">
                                        <Link 
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('PROTOCOLO_INVESTIGACION')}`, urlPrefix)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className={`w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 ${
                                                isCurrentActive 
                                                    ? 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]' 
                                                    : 'btn-vercel-secondary'
                                            }`}
                                        >
                                            <FileText size={14} />
                                            <span>{(currentProject.puedeEditar === false || isPast) ? 'Ver Protocolo' : 'Editar Protocolo'}</span>
                                        </Link>
                                    </div>
                                )}

                                {phase.id === 'Enviado' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                        {isCurrentActive && isAdmin ? (
                                            <Link
                                                to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]"
                                            >
                                                <Shield size={14} />
                                                <span>Iniciar Revisión Técnica</span>
                                            </Link>
                                        ) : isCurrentActive && !isAdmin && currentProject.status === 'En Corrección' ? (
                                            <Link
                                                to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('PROTOCOLO_INVESTIGACION')}`, urlPrefix)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)] !bg-amber-500 hover:!bg-amber-600 !text-white"
                                            >
                                                <AlertCircle size={14} className="animate-pulse" />
                                                <span>Atender Observaciones del Admin</span>
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <Shield size={14} />
                                                <span>Ver Revisión Técnica</span>
                                            </Link>
                                        )}
                                    </div>
                                )}
                                
                                {phase.id === 'En Revisión' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-3 w-full">
                                        <div className="flex flex-col gap-2.5 w-full">
                                            {assignedRevisionUuid ? (
                                                <Link 
                                                    to={`/revisiones/${assignedRevisionUuid}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                    className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold shadow-[0_4px_12px_rgba(0,112,243,0.1)] flex items-center gap-1.5"
                                                >
                                                    <CheckSquare size={14} />
                                                    <span>{(isPast || assignedRevisionStatus === 'Completada') ? 'Ver Mi Rúbrica' : 'Llenar Rúbrica de Arbitraje'}</span>
                                                </Link>
                                            ) : isAdmin ? (
                                                <Link 
                                                    to={`/evaluacion-pares/proyecto/${resolvedProjectUuid}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                    className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold shadow-[0_4px_12px_rgba(0,112,243,0.1)] flex items-center gap-1.5"
                                                >
                                                    <Settings size={14} />
                                                    <span>Gestionar Evaluación por Pares</span>
                                                </Link>
                                            ) : isCurrent ? (
                                                <div className="flex items-start gap-2.5 bg-surface-hover/30 border border-border-thin rounded-lg p-3 text-text-dim text-[11px] leading-relaxed">
                                                    <AlertCircle size={14} className="text-brand shrink-0 mt-0.5" />
                                                    <span>
                                                        El proyecto se encuentra en la etapa formal de **evaluación anónima por pares**. 
                                                        Por motivos de confidencialidad de la evaluación anónima (CACES), los evaluadores asignados 
                                                        y el desarrollo de sus rúbricas permanecen anónimos. Una vez concluido el arbitraje y 
                                                        emitido el dictamen final, el puntaje obtenido y la resolución legal se publicarán aquí.
                                                    </span>
                                                </div>
                                            ) : null}

                                            {currentProject.puntajeEvaluacion !== null && (
                                                <div className="badge-vercel badge-vercel-success !text-[11px] !py-2 flex items-center justify-center gap-1.5 font-semibold animate-fade-in w-full">
                                                    <span>Puntaje: {currentProject.puntajeEvaluacion}/100</span>
                                                    <span className="text-text-dim">|</span>
                                                    <span className="text-[10px] uppercase font-mono">{currentProject.puntajeEvaluacion >= 70 ? 'Aprobado' : 'Rechazado'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {phase.id === 'Aprobado' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                        {currentProject.codigoInstitucional && (
                                            <span className="badge-vercel badge-vercel-success !text-[11px] !py-2 font-mono w-full justify-center">
                                                Código: {currentProject.codigoInstitucional}
                                            </span>
                                        )}
                                        <Link 
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('OFICIO_APROBACION')}`, urlPrefix)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,112,243,0.1)]"
                                        >
                                            <FileSignature size={14} />
                                            <span>Ver Oficio de Aprobación</span>
                                        </Link>
                                        {currentProject.status === 'Aprobado' && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleIniciarEjecucion();
                                                }}
                                                disabled={iniciandoEjecucion}
                                                className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <Settings size={14} className={iniciandoEjecucion ? 'animate-spin' : ''} />
                                                <span>{iniciandoEjecucion ? 'Iniciando...' : 'Iniciar Ejecución'}</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {phase.id === 'Aprobado' && currentProject.status === 'Aprobado' && (
                                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center mt-2 animate-fade-in">
                                        <p className="text-[11px] font-semibold text-amber-500 flex items-center justify-center gap-1.5">
                                            <AlertCircle size={13} /> Pendiente Firma Electrónica
                                        </p>
                                        <p className="text-[10px] text-text-dim mt-0.5">
                                            La Coordinación debe firmar el Oficio de Aprobación para habilitar la etapa de Ejecución.
                                        </p>
                                    </div>
                                )}

                                {phase.id === 'En Ejecución' && (
                                    (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado') ? (
                                        <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                            <Link 
                                                to={`${urlPrefix}/informes-avance/${currentProject.uuid}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <BarChart size={14} />
                                                <span>Informes de Avance</span>
                                            </Link>
                                            <Link 
                                                to={`${urlPrefix}/monitoreo/${currentProject.uuid}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <Activity size={14} className="text-brand animate-pulse" />
                                                <span>Ver Monitoreo Financiero</span>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="mt-3 p-3 bg-surface/40 border border-border-thin/60 rounded-xl text-center space-y-1 select-none">
                                            <div className="flex justify-center text-text-dim/50">
                                                <Shield size={16} />
                                            </div>
                                            <p className="text-[11px] font-semibold text-text-dim/80">
                                                Etapa Bloqueada
                                            </p>
                                            <p className="text-[10px] text-text-dim/60 leading-snug">
                                                Requiere la firma electrónica del Oficio de Aprobación por la Coordinación de Investigación.
                                            </p>
                                        </div>
                                    )
                                )}

                                {phase.id === 'Finalizado' && (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado') && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                        <Link 
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('INFORME_FINAL_INVESTIGACION')}`, urlPrefix)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className={`btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 ${resolvingDocument === 'INFORME_FINAL_INVESTIGACION' ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            <FileSignature size={14} />
                                            <span>{currentProject.status === 'Finalizado' ? 'Ver Informe Final' : 'Informe Final'}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CacesWorkflow;

