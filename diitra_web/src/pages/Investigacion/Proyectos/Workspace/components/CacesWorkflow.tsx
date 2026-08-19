import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Settings, CheckCircle2, FileText, FileSignature, CheckSquare,
    AlertCircle, BarChart, Activity, Shield, FileCheck, Clock, Award, GraduationCap
} from 'lucide-react';
import api from '../../../../../api/axios_config';
import { buildWorkspacePath, templateCodeToEditParam } from '../../../../../core/documents/templateUrl';

const WorkflowPhases = [
    { id: 'Borrador', label: 'Formulación', icon: FileText },
    { id: 'PlanAprendizaje', label: 'Plan de Aprendizaje', icon: GraduationCap },
    { id: 'Enviado', label: 'Revisión Administrador', icon: Shield },
    { id: 'EvaluacionPlanAprendizaje', label: 'Evaluación Plan Aprendizaje', icon: Award },
    { id: 'En Revisión', label: 'Evaluación Pares', icon: CheckCircle2 },
    { id: 'Aprobado', label: 'Aprobación Legal', icon: FileSignature },
    { id: 'En Ejecución', label: 'Ejecución y Avance', icon: Settings },
    { id: 'InformeFinal', label: 'Informe Final', icon: FileSignature },
    { id: 'RevisionInformeFinal', label: 'Revisión Administrador', icon: Shield },
];

interface CacesWorkflowProps {
    currentProject: {
        status: string;
        puedeEditar: boolean;
        puntajeEvaluacion: number | null;
        codigoInstitucional: string | null;
        uuid: string;
        esParticipante?: boolean;
        fechaInicio?: string | null;
        fechaFin?: string | null;
        fechaLimiteSubsanacion?: string | null;
        fechaLimiteInformeFinal?: string | null;
        fechaLimiteSubsanacionFinal?: string | null;
        fecha_limite_subsanacion?: string | null;
        fecha_limite_informe_final?: string | null;
        fecha_limite_subsanacion_final?: string | null;
        fecha_fin?: string | null;
        [key: string]: any;
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
    const isInnovacion = templateCode.startsWith('INNOVACION') || templateCode.startsWith('TRANSFERENCIA');
    const finalReportTemplateCode = isInnovacion ? 'INFORME_FINAL_INNOVACION' : 'INFORME_FINAL_INVESTIGACION';
    const [isFinalReportSigned, setIsFinalReportSigned] = useState(false);
    const [isProtocoloSigned, setIsProtocoloSigned] = useState(false);
    const [isPlanAprendizajeSigned, setIsPlanAprendizajeSigned] = useState(false);
    const [isPlanAprendizajeApproved, setIsPlanAprendizajeApproved] = useState(false);

    const renderDeadlineBadge = (dateStr?: string | null, prefix: string = 'Plazo') => {
        if (!dateStr) return null;
        
        let targetDate: Date;
        if (dateStr.includes('/')) {
            const [d, m, y] = dateStr.split('/').map(Number);
            targetDate = new Date(y, m - 1, d);
        } else {
            targetDate = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
        }

        if (isNaN(targetDate.getTime())) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formattedDate = targetDate.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-mono">
                    <AlertCircle size={11} className="shrink-0" />
                    <span>Vencido ({Math.abs(diffDays)}d)</span>
                </span>
            );
        } else if (diffDays <= 3) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono animate-pulse">
                    <Clock size={11} className="shrink-0" />
                    <span>{diffDays === 0 ? 'Vence hoy' : diffDays === 1 ? 'Vence mañana' : `Vence en ${diffDays}d`}</span>
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-dim bg-surface border border-border-thin px-2 py-0.5 rounded-full font-mono">
                    <Clock size={11} className="shrink-0 text-text-dim/70" />
                    <span>{prefix}: {formattedDate} ({diffDays}d)</span>
                </span>
            );
        }
    };

    useEffect(() => {
        let isMounted = true;
        const checkInstances = async () => {
            if (!resolvedProjectUuid) return;
            try {
                const res = await api.get(`/documents/instances/entity/${resolvedProjectUuid}`);
                if (isMounted && Array.isArray(res.data)) {
                    // 1. Verificar si el Protocolo está firmado
                    const protoDoc = res.data.find(
                        (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                                    d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
                    );
                    const protoSigned = protoDoc ? (protoDoc.is_signed === true || protoDoc.isSigned === true || !!protoDoc.final_pdf_path || !!protoDoc.finalPdfPath || protoDoc.estado === 'Firmado') : false;
                    setIsProtocoloSigned(protoSigned || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status));

                    // 2. Verificar si el Plan de Aprendizaje está firmado por el Director
                    const planLearningDoc = res.data.find(
                        (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
                    );
                    const planSigned = planLearningDoc ? (planLearningDoc.is_signed === true || planLearningDoc.isSigned === true || !!planLearningDoc.final_pdf_path || !!planLearningDoc.finalPdfPath || planLearningDoc.estado === 'Firmado') : false;
                    setIsPlanAprendizajeSigned(planSigned || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status));

                    // 3. Verificar si el informe final está firmado
                    const finalDoc = res.data.find(
                        (d: any) => d.template_code === finalReportTemplateCode || d.templateCode === finalReportTemplateCode
                    );
                    if (finalDoc) {
                        setIsFinalReportSigned(finalDoc.is_signed === true || finalDoc.isSigned === true);
                    }

                    // 4. Verificar si el Plan de Aprendizaje / Evaluación fue aprobado por el Administrador
                    const evalDoc = res.data.find(
                        (d: any) => d.template_code === 'EVALUACION_PLAN_APRENDIZAJE' || d.templateCode === 'EVALUACION_PLAN_APRENDIZAJE'
                    );
                    let approved = false;
                    if (evalDoc) {
                        let contentData: any = null;
                        try {
                            if (evalDoc.content_json) contentData = JSON.parse(evalDoc.content_json);
                        } catch { }

                        approved = evalDoc.is_signed === true || evalDoc.isSigned === true
                            || contentData?.EstadoAprobacion === 'Aprobado'
                            || ['Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status);
                    } else if (['Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status)) {
                        approved = true;
                    }
                    setIsPlanAprendizajeApproved(approved);
                }
            } catch {
                // Silencioso si aún no existe la instancia
            }
        };
        checkInstances();
        const onProjectsChanged = () => checkInstances();
        window.addEventListener('diitra-projects-changed', onProjectsChanged);
        return () => {
            isMounted = false;
            window.removeEventListener('diitra-projects-changed', onProjectsChanged);
        };
    }, [resolvedProjectUuid, finalReportTemplateCode, currentProject.status]);

    return (
        <div className="bento-card static p-6 flex flex-col justify-between group">
            <div className="flex items-center gap-2.5 mb-2">
                <Settings size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">
                    {isInnovacion ? 'Flujo de Innovación e i+TT' : 'Flujo Institucional CACES'}
                </h3>
            </div>

            <div className="relative pl-8 space-y-4 mt-6">
                {/* Track line */}
                <div className="absolute left-3 top-2.5 bottom-2.5 w-0.5 bg-border-thin"></div>

                {WorkflowPhases.map((phase, idx) => {
                    // Determinar el estado lógico de cada una de las fases
                    let isCurrent = false;
                    let isPast = false;
                    let isFuture = false;
                    let isRevisionDone = false;

                    const status = currentProject.status;
                    const isBothInstrumentsSubmitted = (isProtocoloSigned && isPlanAprendizajeSigned) || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(status);

                    if (phase.id === 'Borrador') {
                        isPast = isProtocoloSigned || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(status);
                        isCurrent = !isPast && (status === 'Borrador' || status === 'En Corrección' || status === 'Enviado');
                    } else if (phase.id === 'PlanAprendizaje') {
                        // Fase 2: Plan de Aprendizaje elaborado y firmado por el docente
                        isPast = isPlanAprendizajeSigned || isPlanAprendizajeApproved || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(status);
                        isCurrent = !isPlanAprendizajeSigned;
                        isFuture = false;
                    } else if (phase.id === 'Enviado') {
                        // Fase 3: La revisión del Administrador se abre ÚNICAMENTE cuando el director ha enviado AMBOS instrumentos
                        isCurrent = isBothInstrumentsSubmitted && (status === 'Enviado' || status === 'Borrador' || status === 'En Corrección');
                        isPast = ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(status);
                        isFuture = !isBothInstrumentsSubmitted;
                    } else if (phase.id === 'EvaluacionPlanAprendizaje') {
                        // Fase 4: Evaluación del Plan por el Administrador una vez remitido el expediente completo
                        isCurrent = isBothInstrumentsSubmitted && (status === 'Enviado' || status === 'En Revisión') && !isPlanAprendizajeApproved;
                        isPast = isPlanAprendizajeApproved || ['Aprobado', 'En Ejecución', 'Finalizado'].includes(status);
                        isFuture = !isBothInstrumentsSubmitted;
                    } else if (phase.id === 'En Revisión') {
                        isRevisionDone = (assignedRevisionStatus === 'Completada' || currentProject.puntajeEvaluacion !== null);
                        // COMPUERTA: Solo se habilita si el plan de aprendizaje fue aprobado y el proyecto avanzó a revisión
                        const canOpenPeerReview = isPlanAprendizajeApproved || ['Aprobado', 'En Ejecución', 'Finalizado'].includes(status);
                        isCurrent = (status === 'En Revisión' || (status === 'Enviado' && isPlanAprendizajeApproved)) && canOpenPeerReview;
                        isPast = status === 'Aprobado' || status === 'En Ejecución' || status === 'Finalizado';
                        isFuture = !canOpenPeerReview || status === 'Borrador' || status === 'En Corrección' || (status === 'Enviado' && !isPlanAprendizajeApproved);
                    } else if (phase.id === 'Aprobado') {
                        isCurrent = status === 'Aprobado';
                        isPast = status === 'En Ejecución' || status === 'Finalizado';
                        isFuture = status === 'Borrador' || status === 'En Corrección' || status === 'Enviado' || status === 'En Revisión';
                    } else if (phase.id === 'En Ejecución') {
                        isPast = status === 'Finalizado' || (status === 'En Ejecución' && isFinalReportSigned);
                        isCurrent = status === 'En Ejecución' && !isFinalReportSigned;
                        isFuture = status === 'Borrador' || status === 'En Corrección' || status === 'Enviado' || status === 'En Revisión' || status === 'Aprobado';
                    } else if (phase.id === 'InformeFinal') {
                        isPast = status === 'Finalizado' || (status === 'En Ejecución' && isFinalReportSigned);
                        isCurrent = status === 'En Ejecución' && !isFinalReportSigned;
                        isFuture = status !== 'En Ejecución' && status !== 'Finalizado';
                    } else if (phase.id === 'RevisionInformeFinal') {
                        isPast = status === 'Finalizado';
                        isCurrent = status === 'En Ejecución' && isFinalReportSigned;
                        isFuture = status !== 'Finalizado' && !(status === 'En Ejecución' && isFinalReportSigned);
                    }

                    const showChecked = isPast || (phase.id === 'En Revisión' && isRevisionDone);
                    const isCurrentActive = isCurrent && !(phase.id === 'En Revisión' && isRevisionDone);

                    // Determinar fecha límite correspondiente a la fase
                    let deadlineDate: string | null = null;
                    let deadlinePrefix: string = 'Plazo';

                    if (phase.id === 'Borrador' && status === 'En Corrección') {
                        deadlineDate = currentProject.fecha_limite_subsanacion || currentProject.fechaLimiteSubsanacion || null;
                        deadlinePrefix = 'Subsanación';
                    } else if (phase.id === 'En Ejecución' && status === 'En Ejecución' && !showChecked) {
                        deadlineDate = currentProject.fecha_fin || currentProject.fechaFin || null;
                        deadlinePrefix = 'Cierre Proyecto';
                    } else if (phase.id === 'InformeFinal' && status === 'En Ejecución' && !showChecked) {
                        deadlineDate = currentProject.fecha_limite_subsanacion_final || currentProject.fechaLimiteSubsanacionFinal
                            || currentProject.fecha_limite_informe_final || currentProject.fechaLimiteInformeFinal
                            || currentProject.fecha_fin || currentProject.fechaFin || null;
                        deadlinePrefix = (currentProject.fecha_limite_subsanacion_final || currentProject.fechaLimiteSubsanacionFinal)
                            ? 'Subsanación'
                            : 'Entrega';
                    }

                    return (
                        <div key={phase.id} className="relative group/step">
                            {/* Connector segment — verde sólido si está completado */}
                            {idx < WorkflowPhases.length - 1 && (
                                <div className={`absolute top-9 bottom-[-20px] transition-all duration-300 z-0 ${showChecked
                                    ? 'w-[2.5px] -left-[20.25px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                    : 'w-0.5 -left-[20px] bg-border-thin'
                                    }`} />
                            )}

                            {/* Step Dot */}
                            <div className={`absolute -left-[38px] top-0.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${showChecked
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                                : isCurrentActive
                                    ? 'bg-text-main border-text-main text-bg-deep ring-4 ring-text-main/10 shadow-[0_0_12px_rgba(0,0,0,0.08)] animate-pulse'
                                    : (phase.id === 'InformeFinal' && currentProject.status === 'En Ejecución')
                                        ? 'bg-surface border-text-dim/40 text-text-main'
                                        : 'bg-surface border-border-thin text-text-dim'
                                }`}>
                                {showChecked ? (
                                    <CheckCircle2 size={18} className="stroke-[2.5]" />
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
                                        navigate(`/investigacion/revision-tecnica/${resolvedProjectUuid}`);
                                    } else if (phase.id === 'PlanAprendizaje' && (isCurrent || isPast)) {
                                        navigate(buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('PLAN_APRENDIZAJE')}`, urlPrefix));
                                    } else if (phase.id === 'EvaluacionPlanAprendizaje' && (isCurrent || isPast)) {
                                        navigate(buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('EVALUACION_PLAN_APRENDIZAJE')}`, urlPrefix));
                                    } else if (phase.id === 'En Revisión' && (isCurrent || isPast)) {
                                        if (assignedRevisionUuid) {
                                            navigate(`/revisiones/${assignedRevisionUuid}`);
                                        } else if (isAdmin) {
                                            navigate(`/evaluacion-pares/proyecto/${resolvedProjectUuid}`);
                                        }
                                    } else if (phase.id === 'Aprobado' && (isCurrent || isPast)) {
                                        if (isCurrentActive && currentProject.status === 'Aprobado' && isAdmin && !iniciandoEjecucion) {
                                            handleIniciarEjecucion();
                                        } else {
                                            navigate(buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('OFICIO_APROBACION')}`, urlPrefix));
                                        }
                                    } else if (phase.id === 'InformeFinal' && (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado')) {
                                        navigate(buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(finalReportTemplateCode)}`, urlPrefix));
                                    } else if (phase.id === 'RevisionInformeFinal' && (currentProject.status === 'Finalizado' || (currentProject.status === 'En Ejecución' && isFinalReportSigned))) {
                                        navigate(`/investigacion/revision-informe-final/${resolvedProjectUuid}`);
                                    }
                                }}
                                className={`p-4 rounded-xl border transition-all duration-300 ${isCurrentActive
                                    ? 'bg-surface border-text-dim/40 shadow-[0_2px_16px_rgba(0,0,0,0.06)] cursor-pointer ring-1 ring-text-dim/10'
                                    : showChecked
                                        ? 'bg-surface/20 border-border-thin cursor-pointer opacity-55 hover:opacity-80'
                                        : (isPast || (phase.id === 'InformeFinal' && currentProject.status === 'En Ejecución'))
                                            ? 'bg-surface/20 border-border-thin cursor-pointer opacity-55 hover:opacity-80'
                                            : isFuture
                                                ? 'bg-transparent border-transparent opacity-30 select-none'
                                                : 'bg-transparent border-transparent hover:border-border-thin/40 hover:bg-surface-hover/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`text-xs font-bold tracking-wider uppercase ${isCurrentActive
                                        ? 'text-text-main'
                                        : showChecked || isPast
                                            ? 'text-text-dim'
                                            : 'text-text-dim/60'
                                        }`}>
                                        {phase.label}
                                    </h3>
                                    {deadlineDate && !showChecked && renderDeadlineBadge(deadlineDate, deadlinePrefix)}
                                </div>
                                <p className="text-xs text-text-dim mt-1.5 leading-relaxed font-normal">
                                    {phase.id === 'Borrador' && (
                                        isInnovacion
                                            ? 'Construcción colaborativa del proyecto de innovación y transferencia tecnológica.'
                                            : 'Construcción colaborativa del protocolo de investigación por parte del equipo.'
                                    )}
                                    {phase.id === 'Enviado' && (
                                        (currentProject.status === 'Prepropuesta' || currentProject.status === 'Prepropuesta Rechazada')
                                            ? 'Validación y dictamen preliminar de la idea de proyecto por parte del Administrador.'
                                            : 'Revisión formal de requisitos, carga horaria, firmas y presupuesto institucional.'
                                    )}
                                    {phase.id === 'PlanAprendizaje' && 'Articulación docencia-investigación (APE). Planificación de asignaturas vinculadas, estudiantes y tutorías.'}
                                    {phase.id === 'EvaluacionPlanAprendizaje' && 'Evaluación técnica, pertinencia académica y dictamen del Plan de Aprendizaje por parte del Administrador.'}
                                    {phase.id === 'En Revisión' && 'Revisión técnica anónima por pares evaluadores asignados por el Director.'}
                                    {phase.id === 'Aprobado' && 'Validación final del consejo académico y firma electrónica de actas formales.'}
                                    {phase.id === 'En Ejecución' && 'Seguimiento de hitos, envío de informes de avance y ejecución presupuestaria.'}
                                    {phase.id === 'InformeFinal' && 'Elaboración, consolidación de resultados, producción científica y firma digital del equipo.'}
                                    {phase.id === 'RevisionInformeFinal' && 'Auditoría técnica formal, verificación de cumplimiento de metas y dictamen de cierre institucional.'}
                                </p>

                                {/* 1. FORMULACIÓN */}
                                {phase.id === 'Borrador' && (
                                    <div className="mt-4">
                                        <Link
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(templateCode)}`, urlPrefix)}
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className={`w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 ${isCurrentActive
                                                ? 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                : 'btn-vercel-secondary'
                                                }`}
                                        >
                                            <FileText size={14} />
                                            <span>
                                                {(currentProject.puedeEditar === false || isPast)
                                                    ? (isInnovacion ? 'Ver Proyecto' : 'Ver Protocolo')
                                                    : (isInnovacion ? 'Editar Proyecto de Innovación' : 'Editar Protocolo')}
                                            </span>
                                        </Link>
                                    </div>
                                )}

                                {/* 2. REVISIÓN ADMINISTRADOR (PROTOCOLO) */}
                                {phase.id === 'Enviado' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                        {isCurrentActive && isAdmin ? (
                                            <Link
                                                to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]"
                                            >
                                                <Shield size={14} />
                                                <span>Iniciar Revisión Técnica</span>
                                            </Link>
                                        ) : isCurrentActive && !isAdmin && currentProject.status === 'En Corrección' ? (
                                            <Link
                                                to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(templateCode)}`, urlPrefix)}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.2)] !bg-amber-500 hover:!bg-amber-600 !text-white"
                                            >
                                                <AlertCircle size={14} className="animate-pulse" />
                                                <span>Atender Observaciones del Admin</span>
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/investigacion/revision-tecnica/${resolvedProjectUuid}`}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <Shield size={14} />
                                                <span>Ver Revisión Técnica</span>
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* 2.5 PLAN DE APRENDIZAJE */}
                                {phase.id === 'PlanAprendizaje' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in">
                                        <Link
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('PLAN_APRENDIZAJE')}`, urlPrefix)}
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className={`w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 ${isCurrentActive
                                                ? 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                : 'btn-vercel-secondary'
                                                }`}
                                        >
                                            <GraduationCap size={14} />
                                            <span>
                                                {currentProject.status === 'Finalizado'
                                                    ? 'Ver Plan de Aprendizaje'
                                                    : 'Plan de Aprendizaje (Docencia - APE)'}
                                            </span>
                                        </Link>
                                    </div>
                                )}

                                {/* 2.6 EVALUACIÓN PLAN DE APRENDIZAJE */}
                                {phase.id === 'EvaluacionPlanAprendizaje' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in">
                                        <Link
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('EVALUACION_PLAN_APRENDIZAJE')}`, urlPrefix)}
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className={`w-full justify-center py-2.5 transition-all duration-300 font-semibold flex items-center gap-1.5 ${isCurrentActive && isAdmin
                                                ? 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                : 'btn-vercel-secondary'
                                                }`}
                                        >
                                            <Award size={14} />
                                            <span>
                                                {isAdmin
                                                    ? 'Evaluar Plan de Aprendizaje'
                                                    : 'Ver Evaluación del Plan'}
                                            </span>
                                        </Link>
                                    </div>
                                )}

                                {/* 3. EVALUACIÓN POR PARES */}
                                {phase.id === 'En Revisión' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-3 w-full">
                                        <div className="flex flex-col gap-2.5 w-full">
                                            {assignedRevisionUuid ? (
                                                <Link
                                                    to={`/revisiones/${assignedRevisionUuid}`}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className={`!py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 ${(isPast || assignedRevisionStatus === 'Completada')
                                                        ? 'btn-vercel-secondary'
                                                        : 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                        }`}
                                                >
                                                    <CheckSquare size={14} />
                                                    <span>{(isPast || assignedRevisionStatus === 'Completada') ? 'Ver Mi Rúbrica' : 'Llenar Rúbrica de Arbitraje'}</span>
                                                </Link>
                                            ) : isAdmin ? (
                                                <Link
                                                    to={`/evaluacion-pares/proyecto/${resolvedProjectUuid}`}
                                                    state={{ fromWorkspace: true }}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className={`!py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 ${(isPast || isRevisionDone || currentProject.puntajeEvaluacion !== null)
                                                        ? 'btn-vercel-secondary'
                                                        : 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                        }`}
                                                >
                                                    {(isPast || isRevisionDone || currentProject.puntajeEvaluacion !== null) ? (
                                                        <>
                                                            <CheckSquare size={14} />
                                                            <span>Ver Evaluación por Pares</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Settings size={14} />
                                                            <span>Gestionar Evaluación por Pares</span>
                                                        </>
                                                    )}
                                                </Link>
                                            ) : isCurrent ? (
                                                <div className="flex items-start gap-2.5 bg-surface-hover/30 border border-border-thin rounded-lg p-3 text-text-dim text-[11px] leading-relaxed">
                                                    <AlertCircle size={14} className="text-brand shrink-0 mt-0.5" />
                                                    <span>
                                                        El proyecto se encuentra en la etapa formal de evaluación anónima por pares.
                                                        Por motivos de confidencialidad de la evaluación anónima (CACES), los evaluadores asignados
                                                        y el desarrollo de sus rúbricas permanecen anónimos. Una vez concluido el arbitraje y
                                                        emitido el dictamen final, el puntaje obtenido y la resolución legal se publicarán aquí.
                                                    </span>
                                                </div>
                                            ) : null}

                                            {currentProject.puntajeEvaluacion !== null && currentProject.puntajeEvaluacion < 70 && (
                                                <div className="badge-vercel badge-vercel-error !text-[11px] !py-2 flex items-center justify-center gap-1.5 font-semibold animate-fade-in w-full">
                                                    <span>Puntaje: {currentProject.puntajeEvaluacion}/100</span>
                                                    <span className="text-text-dim">|</span>
                                                    <span className="text-[10px] uppercase font-mono">Desaprobado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 4. APROBACIÓN LEGAL */}
                                {phase.id === 'Aprobado' && (isCurrent || isPast) && (
                                    <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                        {currentProject.codigoInstitucional && (
                                            <span className="badge-vercel badge-vercel-success !text-[11px] !py-2 font-mono w-full justify-center">
                                                Código: {currentProject.codigoInstitucional}
                                            </span>
                                        )}
                                        <Link
                                            to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam('OFICIO_APROBACION')}`, urlPrefix)}
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className={`!py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 ${isCurrentActive
                                                ? 'btn-vercel-primary shadow-[0_4px_12px_rgba(0,112,243,0.1)]'
                                                : 'btn-vercel-secondary'
                                                }`}
                                        >
                                            <FileSignature size={14} />
                                            <span>Ver Oficio de Aprobación</span>
                                        </Link>
                                        {currentProject.status === 'Aprobado' && isAdmin && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleIniciarEjecucion(); }}
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

                                {/* 5. EJECUCIÓN Y AVANCE */}
                                {phase.id === 'En Ejecución' && (
                                    (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado') && (
                                        <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                            <Link
                                                to={`${urlPrefix}/informes-avance/${currentProject.uuid}`}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <BarChart size={14} />
                                                <span>Informes de Avance</span>
                                            </Link>
                                            <Link
                                                to={`${urlPrefix}/monitoreo/${currentProject.uuid}`}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <Activity size={14} className="text-brand animate-pulse" />
                                                <span>Ver Monitoreo Financiero</span>
                                            </Link>
                                        </div>
                                    )
                                )}

                                {/* 6. INFORME FINAL (FORMULACIÓN / REDACCIÓN POR EL EQUIPO) */}
                                {phase.id === 'InformeFinal' && (
                                    (currentProject.status === 'En Ejecución' || currentProject.status === 'Finalizado') && (
                                        <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                            {isFinalReportSigned || currentProject.status === 'Finalizado' ? (
                                                <Link
                                                    to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(finalReportTemplateCode)}`, urlPrefix)}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="btn-vercel-secondary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                                >
                                                    <FileText size={14} />
                                                    <span>Ver Informe Final</span>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(finalReportTemplateCode)}`, urlPrefix)}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className={`btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,112,243,0.1)] ${resolvingDocument === finalReportTemplateCode ? 'pointer-events-none opacity-50' : ''}`}
                                                >
                                                    <FileSignature size={14} />
                                                    <span>Elaborar y Firmar Informe Final</span>
                                                </Link>
                                            )}
                                        </div>
                                    )
                                )}

                                {/* 7. REVISIÓN ADMINISTRADOR (INFORME FINAL / DICTAMEN DE CIERRE) */}
                                {phase.id === 'RevisionInformeFinal' && (
                                    currentProject.status === 'Finalizado' ? (
                                        <div className="mt-4 animate-fade-in space-y-2.5">
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-1">
                                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                                                    <Award size={15} /> Proyecto Culminado Oficialmente
                                                </p>
                                                <p className="text-[10px] text-text-dim">
                                                    El proyecto cuenta con cierre legal, acta institucional y certificados emitidos automáticamente.
                                                </p>
                                            </div>
                                            <Link
                                                to={buildWorkspacePath(templateCode, resolvedProjectUuid, `?edit=${templateCodeToEditParam(finalReportTemplateCode)}`, urlPrefix)}
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="btn-vercel-primary !py-2.5 w-full justify-center font-semibold flex items-center gap-1.5"
                                            >
                                                <FileSignature size={14} />
                                                <span>Ver Informe Final Oficial</span>
                                            </Link>
                                            {currentProject.esParticipante && (
                                                <Link
                                                    to="/mis-certificados"
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="btn-vercel-secondary !py-2 w-full justify-center text-xs font-bold flex items-center gap-1.5 hover:!border-brand/50 no-underline text-text-main"
                                                >
                                                    <Award size={14} className="text-brand" />
                                                    <span>Ver Mis Certificados</span>
                                                </Link>
                                            )}
                                        </div>
                                    ) : isFinalReportSigned && currentProject.status === 'En Ejecución' ? (
                                        <div className="mt-4 animate-fade-in flex flex-col gap-2.5">
                                            {isAdmin ? (
                                                <Link
                                                    to={`/investigacion/revision-informe-final/${resolvedProjectUuid}`}
                                                    onClick={(e) => { e.stopPropagation(); }}
                                                    className="btn-vercel-primary !py-2.5 w-full justify-center text-xs font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,112,243,0.15)]"
                                                >
                                                    <Shield size={14} />
                                                    <span>Auditar y Dictaminar Informe Final</span>
                                                </Link>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 text-center">
                                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                                                            <Clock size={14} /> Informe en Revisión por Coordinación
                                                        </p>
                                                        <p className="text-[10px] text-text-dim leading-relaxed">
                                                            Su Informe Final ha sido remitido. La Coordinación de Investigación está auditando los resultados.
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to={`/investigacion/revision-informe-final/${resolvedProjectUuid}`}
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        className="btn-vercel-secondary !py-2.5 w-full justify-center text-xs font-bold flex items-center gap-1.5"
                                                    >
                                                        <Shield size={14} />
                                                        <span>Ver Revisión Técnica</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ) : null
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


