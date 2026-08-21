import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, FileText, GraduationCap, FileSignature, BarChart, Award, Clock } from 'lucide-react';
import api from '../../../../../api/axios_config';
import { useAuth } from '../../../../../api/AuthContext';
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
    projectDocuments?: any[];
    resolvedProjectUuid: string | null;
    setActiveDocument?: (doc: string) => void;
    isAdmin?: boolean;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
    currentProject,
    projectDocuments,
    resolvedProjectUuid,
    setActiveDocument,
    isAdmin = false
}) => {
    const { isDocente, isEstudiante, roleDisplayName } = useAuth();
    const [asyncProtocoloSigned, setAsyncProtocoloSigned] = useState(false);
    const [asyncPlanSigned, setAsyncPlanSigned] = useState(false);
    const [asyncOficioSigned, setAsyncOficioSigned] = useState(false);
    const [asyncFinalReportSigned, setAsyncFinalReportSigned] = useState(false);

    const isInnovacion = currentProject.template_code?.startsWith('INNOVACION') || currentProject.linea?.toLowerCase().includes('innov');
    const finalReportCode = isInnovacion ? 'INFORME_FINAL_INNOVACION' : 'INFORME_FINAL_INVESTIGACION';

    const isDocValidlySigned = (doc: any): boolean => {
        if (!doc) return false;
        if (['Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status)) return true;
        const hasSignedState = doc.state === 3 || doc.state === '3' || doc.state === 'Signed' || doc.estado === 'Firmado' || doc.is_signed === true || doc.isSigned === true;
        const hasSignedFile = Boolean(doc.final_pdf_path || doc.finalPdfPath);
        return hasSignedState || hasSignedFile;
    };

    const derivedSignatures = useMemo(() => {
        if (!projectDocuments || projectDocuments.length === 0) return null;
        const protoDoc = projectDocuments.find(
            (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                        d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
        );
        const planDoc = projectDocuments.find(
            (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
        );
        const oficioDoc = projectDocuments.find(
            (d: any) => d.template_code === 'OFICIO_APROBACION' || d.templateCode === 'OFICIO_APROBACION'
        );
        const isAnyFinalDocSigned = (docs: any[]): boolean => {
            if (!docs || docs.length === 0) return false;
            return docs.some((doc: any) => {
                const isMatch = doc.template_code === finalReportCode || doc.templateCode === finalReportCode ||
                    doc.template_code === 'INFORME_FINAL_INVESTIGACION' || doc.templateCode === 'INFORME_FINAL_INVESTIGACION' ||
                    doc.template_code === 'INFORME_FINAL_INNOVACION' || doc.templateCode === 'INFORME_FINAL_INNOVACION' ||
                    doc.template_code === 'INFORME_FINAL' || doc.templateCode === 'INFORME_FINAL';
                if (!isMatch) return false;
                return (
                    doc.is_signed === true || doc.isSigned === true ||
                    doc.state === 3 || doc.state === '3' || doc.state === 'Signed' ||
                    doc.estado === 3 || doc.estado === '3' || doc.estado === 'Firmado' ||
                    Boolean(doc.final_pdf_path || doc.finalPdfPath)
                );
            });
        };

        return {
            isProtocoloSigned: isDocValidlySigned(protoDoc),
            isPlanSigned: isDocValidlySigned(planDoc),
            isOficioSigned: Boolean(oficioDoc && (oficioDoc.is_signed || oficioDoc.isSigned || oficioDoc.state === 3 || oficioDoc.state === 'Signed' || oficioDoc.estado === 'Firmado' || oficioDoc.final_pdf_path || oficioDoc.finalPdfPath)),
            isFinalReportSigned: isAnyFinalDocSigned(projectDocuments)
        };
    }, [projectDocuments, currentProject.status, finalReportCode]);

    const isProtocoloSigned = derivedSignatures ? derivedSignatures.isProtocoloSigned : asyncProtocoloSigned;
    const isPlanSigned = derivedSignatures ? derivedSignatures.isPlanSigned : asyncPlanSigned;
    const isOficioSigned = derivedSignatures ? derivedSignatures.isOficioSigned : asyncOficioSigned;
    const isFinalReportSigned = derivedSignatures ? derivedSignatures.isFinalReportSigned : asyncFinalReportSigned;

    useEffect(() => {
        if (projectDocuments && projectDocuments.length > 0) return;
        let isMounted = true;
        const checkSignatures = async () => {
            if (!resolvedProjectUuid) return;
            try {
                const res = await api.get(`/documents/instances/entity/${resolvedProjectUuid}`);
                if (isMounted && Array.isArray(res.data)) {
                    const protoDoc = res.data.find(
                        (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                                    d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
                    );
                    setAsyncProtocoloSigned(isDocValidlySigned(protoDoc));

                    const planDoc = res.data.find(
                        (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
                    );
                    setAsyncPlanSigned(isDocValidlySigned(planDoc));

                    const oficioDoc = res.data.find(
                        (d: any) => d.template_code === 'OFICIO_APROBACION' || d.templateCode === 'OFICIO_APROBACION'
                    );
                    setAsyncOficioSigned(Boolean(oficioDoc && (oficioDoc.is_signed || oficioDoc.isSigned || oficioDoc.state === 3 || oficioDoc.state === 'Signed' || oficioDoc.estado === 'Firmado' || oficioDoc.final_pdf_path || oficioDoc.finalPdfPath)));

                    const hasSignedFinal = res.data.some(
                        (d: any) => {
                            const isMatch = d.template_code === finalReportCode || d.templateCode === finalReportCode ||
                                d.template_code === 'INFORME_FINAL_INVESTIGACION' || d.templateCode === 'INFORME_FINAL_INVESTIGACION' ||
                                d.template_code === 'INFORME_FINAL_INNOVACION' || d.templateCode === 'INFORME_FINAL_INNOVACION' ||
                                d.template_code === 'INFORME_FINAL' || d.templateCode === 'INFORME_FINAL';
                            if (!isMatch) return false;
                            return (
                                d.is_signed === true || d.isSigned === true ||
                                d.state === 3 || d.state === '3' || d.state === 'Signed' ||
                                d.estado === 3 || d.estado === '3' || d.estado === 'Firmado' ||
                                Boolean(d.final_pdf_path || d.finalPdfPath)
                            );
                        }
                    );
                    setAsyncFinalReportSigned(hasSignedFinal);
                }
            } catch {
                // Silencioso
            }
        };

        checkSignatures();
        const onProjectsChanged = () => checkSignatures();
        window.addEventListener('diitra-projects-changed', onProjectsChanged);
        return () => {
            isMounted = false;
            window.removeEventListener('diitra-projects-changed', onProjectsChanged);
        };
    }, [resolvedProjectUuid, currentProject.status, projectDocuments, finalReportCode]);

    const isAllFormulationSigned = isProtocoloSigned && isPlanSigned;

    // Mensajes y encabezados contextuales según etapa y rol
    const stageInfo = useMemo(() => {
        const st = currentProject.status;
        if (['Borrador', 'Enviado', 'En Corrección'].includes(st)) {
            let roleMsg = 'Para habilitar la revisión técnica, el Director debe firmar ambos documentos.';
            if (isAdmin) {
                roleMsg = isAllFormulationSigned 
                    ? 'Expediente completo remitido. Procede con la revisión técnica.' 
                    : 'El equipo docente está completando los instrumentos requeridos.';
            } else if (isEstudiante) {
                roleMsg = isAllFormulationSigned
                    ? 'Instrumentos formulados y firmados. En espera de revisión institucional.'
                    : 'Fase de formulación. El Director del proyecto debe firmar ambos instrumentos para enviar a revisión.';
            } else {
                // Docente / Director
                if (!isProtocoloSigned && !isPlanSigned) {
                    roleMsg = 'Debes firmar el Protocolo y el Plan de Aprendizaje para remitir a revisión.';
                } else if (!isProtocoloSigned) {
                    roleMsg = 'Tienes pendiente firmar el Protocolo de Investigación para completar el expediente.';
                } else if (!isPlanSigned) {
                    roleMsg = 'Tienes pendiente firmar el Plan de Aprendizaje para completar el expediente.';
                } else {
                    roleMsg = 'Expediente firmado y remitido con éxito. En espera de dictamen técnico.';
                }
            }
            return {
                title: 'Instrumentos de Formulación',
                description: roleMsg,
                stage: 'formulacion'
            };
        }

        if (st === 'En Revisión') {
            return {
                title: 'Evaluación y Arbitraje',
                description: isAdmin 
                    ? 'Gestiona la auditoría técnica y el tribunal de evaluación por pares CACES.'
                    : 'El proyecto está en proceso formal de revisión técnica y evaluación por pares.',
                stage: 'revision'
            };
        }

        if (st === 'Aprobado') {
            return {
                title: 'Aprobación Legal',
                description: isAdmin
                    ? 'Firma el Oficio de Aprobación institucional para habilitar la etapa de Ejecución.'
                    : 'Proyecto aprobado formalmente. En espera de la emisión del Oficio de Aprobación.',
                stage: 'aprobado'
            };
        }

        if (st === 'En Ejecución') {
            return {
                title: 'Instrumentos de Ejecución',
                description: isAdmin
                    ? 'Supervisión activa de cronograma, hitos de avance y ejecución presupuestaria.'
                    : (isEstudiante 
                        ? 'Proyecto en ejecución. Colabora en el desarrollo de hitos y actividades formativas.' 
                        : 'Registra los informes de avance periódicos y prepara el Informe Final.'),
                stage: 'ejecucion'
            };
        }

        return {
            title: 'Expediente Institucional',
            description: 'Proyecto culminado y archivado formalmente en el repositorio institucional.',
            stage: 'finalizado'
        };
    }, [currentProject.status, isAdmin, isEstudiante, isDocente, isProtocoloSigned, isPlanSigned, isAllFormulationSigned]);

    return (
        <div className="flex flex-col gap-3">
            {/* Banner de Revisión Técnica para el Administrador */}
            {isAdmin && currentProject.status === 'Enviado' && resolvedProjectUuid && isAllFormulationSigned && (
                <div className="bento-card static p-5 flex flex-col justify-between border border-brand/30 bg-brand/[0.03] shadow-md animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Shield size={13} className="text-brand animate-pulse" />
                            <span className="section-label text-brand">Revisión Técnica Requerida</span>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            El expediente completo (Protocolo y Plan de Aprendizaje) ha sido remitido por el Director para su revisión técnica.
                        </p>
                    </div>
                    <div className="mt-4">
                        <Link
                            to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                            className="w-full btn-brand py-2 px-3 text-[10px] rounded-md no-underline flex items-center justify-center gap-1.5"
                        >
                            <Shield size={12} />
                            <span>Iniciar Revisión Técnica</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Banner de Correcciones Requeridas para el Docente/Investigador */}
            {!isAdmin && currentProject.status === 'En Corrección' && (
                <div className="bento-card static p-5 flex flex-col justify-between border border-warning/30 bg-warning/[0.03] shadow-md animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <AlertCircle size={13} className="text-warning animate-pulse" />
                            <span className="section-label text-warning">Correcciones Requeridas</span>
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            El administrador ha retornado el proyecto con observaciones técnicas que deben ser atendidas en su protocolo.
                        </p>
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (setActiveDocument) setActiveDocument('PROTOCOLO_INVESTIGACION');
                            }}
                            className="w-full btn-vercel-primary py-2 px-3 text-[10px] rounded-md flex items-center justify-center gap-1.5"
                        >
                            <FileText size={12} />
                            <span>Atender Observaciones</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Tarjeta Dinámica de Instrumentos Requeridos por Etapa */}
            <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-text-main/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-text-main/8 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                            <Shield size={13} className="text-text-dim" />
                            <span className="section-label text-text-dim">
                                {stageInfo.title}
                            </span>
                        </div>
                        <span className="text-[10px] text-text-dim/70 font-mono">
                            {roleDisplayName || (isAdmin ? 'Admin' : isEstudiante ? 'Estudiante' : 'Docente')}
                        </span>
                    </div>
                    <p className="text-xs text-text-dim leading-relaxed">
                        {stageInfo.description}
                    </p>
                </div>

                <div className="mt-4 space-y-2">
                    {/* ETAPA: FORMULACIÓN / REVISIÓN INICIAL */}
                    {['formulacion', 'revision'].includes(stageInfo.stage) && (
                        <>
                            {/* 1. Protocolo de Investigación */}
                            <div
                                {...(!isProtocoloSigned && setActiveDocument ? {
                                    onClick: () => setActiveDocument('PROTOCOLO_INVESTIGACION'),
                                    role: "button",
                                    tabIndex: 0,
                                    onKeyDown: (e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setActiveDocument('PROTOCOLO_INVESTIGACION');
                                        }
                                    }
                                } : {})}
                                className={`p-2.5 rounded-lg bg-surface/40 border border-border-thin flex items-center justify-between gap-2.5 transition-all ${
                                    !isProtocoloSigned
                                        ? 'hover:border-border-hover hover:bg-surface/80 cursor-pointer group/item outline-none focus-visible:ring-1 focus-visible:ring-brand'
                                        : 'opacity-90'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 transition-colors ${
                                        !isProtocoloSigned ? 'group-hover/item:text-brand group-hover/item:border-brand/30' : ''
                                    }`}>
                                        <FileText size={13} />
                                    </div>
                                    <span className={`text-xs font-medium text-text-main truncate transition-colors ${
                                        !isProtocoloSigned ? 'group-hover/item:text-brand' : ''
                                    }`}>
                                        Protocolo de {isInnovacion ? 'Innovación' : 'Investigación'}
                                    </span>
                                </div>

                                {isProtocoloSigned ? (
                                    <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]" title="Firmado">
                                        <CheckCircle2 size={11} />
                                        <span>Firmado</span>
                                    </span>
                                ) : (
                                    <span className="badge-vercel badge-vercel-warning shrink-0 text-[10px]">
                                        <span className="dot dot-warning dot-pulse" />
                                        <span>{isDocente ? 'Falta firmar' : 'Pendiente'}</span>
                                    </span>
                                )}
                            </div>

                            {/* 2. Plan de Aprendizaje */}
                            <div
                                {...(!isPlanSigned && setActiveDocument ? {
                                    onClick: () => setActiveDocument('PLAN_APRENDIZAJE'),
                                    role: "button",
                                    tabIndex: 0,
                                    onKeyDown: (e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setActiveDocument('PLAN_APRENDIZAJE');
                                        }
                                    }
                                } : {})}
                                className={`p-2.5 rounded-lg bg-surface/40 border border-border-thin flex items-center justify-between gap-2.5 transition-all ${
                                    !isPlanSigned
                                        ? 'hover:border-border-hover hover:bg-surface/80 cursor-pointer group/item outline-none focus-visible:ring-1 focus-visible:ring-brand'
                                        : 'opacity-90'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 transition-colors ${
                                        !isPlanSigned ? 'group-hover/item:text-brand group-hover/item:border-brand/30' : ''
                                    }`}>
                                        <GraduationCap size={13} />
                                    </div>
                                    <span className={`text-xs font-medium text-text-main truncate transition-colors ${
                                        !isPlanSigned ? 'group-hover/item:text-brand' : ''
                                    }`}>
                                        Plan de Aprendizaje
                                    </span>
                                </div>

                                {isPlanSigned ? (
                                    <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]" title="Firmado">
                                        <CheckCircle2 size={11} />
                                        <span>Firmado</span>
                                    </span>
                                ) : (
                                    <span className="badge-vercel badge-vercel-warning shrink-0 text-[10px]">
                                        <span className="dot dot-warning dot-pulse" />
                                        <span>{isDocente ? 'Falta firmar' : 'Pendiente'}</span>
                                    </span>
                                )}
                            </div>
                        </>
                    )}

                    {/* ETAPA: APROBACIÓN LEGAL */}
                    {stageInfo.stage === 'aprobado' && (
                        <div
                            {...(setActiveDocument ? {
                                onClick: () => setActiveDocument('OFICIO_APROBACION'),
                                role: "button",
                                tabIndex: 0,
                                onKeyDown: (e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveDocument('OFICIO_APROBACION');
                                    }
                                }
                            } : {})}
                            className="p-2.5 rounded-lg bg-surface/40 border border-border-thin flex items-center justify-between gap-2.5 transition-all hover:border-border-hover hover:bg-surface/80 cursor-pointer group/item"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 group-hover/item:text-brand group-hover/item:border-brand/30 transition-colors">
                                    <FileSignature size={13} />
                                </div>
                                <span className="text-xs font-medium text-text-main truncate group-hover/item:text-brand transition-colors">
                                    Oficio de Aprobación
                                </span>
                            </div>

                            {isOficioSigned ? (
                                <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]">
                                    <CheckCircle2 size={11} />
                                    <span>Emitido</span>
                                </span>
                            ) : (
                                <span className="badge-vercel badge-vercel-warning shrink-0 text-[10px]">
                                    <span className="dot dot-warning dot-pulse" />
                                    <span>{isAdmin ? 'Falta firmar' : 'En emisión'}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* ETAPA: EJECUCIÓN / INFORME FINAL */}
                    {['ejecucion', 'finalizado'].includes(stageInfo.stage) && (
                        <>
                            <Link
                                to={`/investigacion/informes-avance/${resolvedProjectUuid}`}
                                className="p-2.5 rounded-lg bg-surface/40 border border-border-thin flex items-center justify-between gap-2.5 transition-all hover:border-border-hover hover:bg-surface/80 no-underline group/item"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 group-hover/item:text-brand group-hover/item:border-brand/30 transition-colors">
                                        <BarChart size={13} />
                                    </div>
                                    <span className="text-xs font-medium text-text-main truncate group-hover/item:text-brand transition-colors">
                                        Informes de Avance
                                    </span>
                                </div>
                                <span className="badge-vercel badge-vercel-info shrink-0 text-[10px]">
                                    <Clock size={11} />
                                    <span>Seguimiento</span>
                                </span>
                            </Link>

                            <div
                                {...(setActiveDocument ? {
                                    onClick: () => setActiveDocument(finalReportCode),
                                    role: "button",
                                    tabIndex: 0,
                                    onKeyDown: (e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setActiveDocument(finalReportCode);
                                        }
                                    }
                                } : {})}
                                className="p-2.5 rounded-lg bg-surface/40 border border-border-thin flex items-center justify-between gap-2.5 transition-all hover:border-border-hover hover:bg-surface/80 cursor-pointer group/item"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 group-hover/item:text-brand group-hover/item:border-brand/30 transition-colors">
                                        <Award size={13} />
                                    </div>
                                    <span className="text-xs font-medium text-text-main truncate group-hover/item:text-brand transition-colors">
                                        Informe Final
                                    </span>
                                </div>

                                {isFinalReportSigned ? (
                                    <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]">
                                        <CheckCircle2 size={11} />
                                        <span>Firmado</span>
                                    </span>
                                ) : (
                                    <span className="badge-vercel badge-vercel-neutral shrink-0 text-[10px]">
                                        <span>{currentProject.status === 'Finalizado' ? 'Cerrado' : 'En redacción'}</span>
                                    </span>
                                )}
                            </div>
                        </>
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
