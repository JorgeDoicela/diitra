import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, FileText, GraduationCap } from 'lucide-react';
import api from '../../../../../api/axios_config';
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
    const [isProtocoloSigned, setIsProtocoloSigned] = useState(false);
    const [isPlanSigned, setIsPlanSigned] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkSignatures = async () => {
            if (!resolvedProjectUuid) return;
            try {
                const res = await api.get(`/documents/instances/entity/${resolvedProjectUuid}`);
                if (isMounted && Array.isArray(res.data)) {
                    const isDocValidlySigned = (doc: any): boolean => {
                        if (!doc) return false;
                        // Si el proyecto ya fue aprobado/ejecutado institucionalmente
                        if (['Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status)) return true;
                        // Verificación estricta de firma del documento
                        const hasSignedState = doc.state === 3 || doc.state === 'Signed' || doc.estado === 'Firmado' || doc.is_signed === true || doc.isSigned === true;
                        const hasSignedFile = Boolean(doc.final_pdf_path || doc.finalPdfPath);
                        return hasSignedState || hasSignedFile;
                    };

                    const protoDoc = res.data.find(
                        (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                                    d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
                    );
                    setIsProtocoloSigned(isDocValidlySigned(protoDoc));

                    const planDoc = res.data.find(
                        (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
                    );
                    setIsPlanSigned(isDocValidlySigned(planDoc));
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
    }, [resolvedProjectUuid, currentProject.status]);

    const isAllSigned = isProtocoloSigned && isPlanSigned;

    return (
        <div className="flex flex-col gap-3">
            {/* Banner de Revisión Técnica para el Administrador */}
            {isAdmin && currentProject.status === 'Enviado' && resolvedProjectUuid && isAllSigned && (
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
                            className="w-full btn-brand py-2 px-3 text-[10px] rounded-md no-underline"
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
                            className="w-full btn-vercel-primary py-2 px-3 text-[10px] rounded-md"
                        >
                            <FileText size={12} />
                            <span>Atender Observaciones</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Firmas de Expediente Institucional */}
            <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-text-main/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-text-main/8 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Shield size={13} className="text-text-dim" />
                        <span className="section-label text-text-dim">
                            Instrumentos Requeridos
                        </span>
                    </div>
                    <p className="text-xs text-text-dim leading-relaxed">
                        Para habilitar la revisión del Administrador, el Director debe firmar y enviar ambos documentos.
                    </p>
                </div>
                <div className="mt-4 space-y-2.5">
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
                        className={`p-3 rounded-lg bg-surface/50 border border-border-thin transition-all ${
                            !isProtocoloSigned
                                ? 'hover:border-border-hover hover:bg-surface/80 cursor-pointer group/card outline-none focus-visible:ring-1 focus-visible:ring-brand'
                                : 'opacity-90'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 transition-colors ${
                                    !isProtocoloSigned ? 'group-hover/card:text-brand group-hover/card:border-brand/30' : ''
                                }`}>
                                    <FileText size={13} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs font-medium text-text-main truncate transition-colors ${
                                        !isProtocoloSigned ? 'group-hover/card:text-brand' : ''
                                    }`}>
                                        Protocolo de Investigación
                                    </p>
                                    <p className="text-[11px] text-text-dim truncate">Documento base del proyecto</p>
                                </div>
                            </div>
                            {isProtocoloSigned ? (
                                <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]" title="Firmado">
                                    <CheckCircle2 size={11} />
                                    <span>Firmado</span>
                                </span>
                            ) : (
                                <span className="badge-vercel badge-vercel-warning shrink-0 text-[10px]">
                                    <span className="dot dot-warning dot-pulse" />
                                    <span>Falta completar</span>
                                </span>
                            )}
                        </div>
                        {!isProtocoloSigned && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (setActiveDocument) setActiveDocument('PROTOCOLO_INVESTIGACION');
                                }}
                                className="mt-2.5 w-full btn-vercel-secondary py-1.5 px-2.5 text-[9.5px] rounded-md"
                            >
                                <FileText size={11} />
                                <span>Completar Protocolo</span>
                            </button>
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
                        className={`p-3 rounded-lg bg-surface/50 border border-border-thin transition-all ${
                            !isPlanSigned
                                ? 'hover:border-border-hover hover:bg-surface/80 cursor-pointer group/card outline-none focus-visible:ring-1 focus-visible:ring-brand'
                                : 'opacity-90'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-dim shrink-0 transition-colors ${
                                    !isPlanSigned ? 'group-hover/card:text-brand group-hover/card:border-brand/30' : ''
                                }`}>
                                    <GraduationCap size={13} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs font-medium text-text-main truncate transition-colors ${
                                        !isPlanSigned ? 'group-hover/card:text-brand' : ''
                                    }`}>
                                        Plan de Aprendizaje
                                    </p>
                                    <p className="text-[11px] text-text-dim truncate">Articulación docencia (APE)</p>
                                </div>
                            </div>
                            {isPlanSigned ? (
                                <span className="badge-vercel badge-vercel-success shrink-0 text-[10px]" title="Firmado">
                                    <CheckCircle2 size={11} />
                                    <span>Firmado</span>
                                </span>
                            ) : (
                                <span className="badge-vercel badge-vercel-warning shrink-0 text-[10px]">
                                    <span className="dot dot-warning dot-pulse" />
                                    <span>Falta completar</span>
                                </span>
                            )}
                        </div>
                        {!isPlanSigned && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (setActiveDocument) setActiveDocument('PLAN_APRENDIZAJE');
                                }}
                                className="mt-2.5 w-full btn-vercel-secondary py-1.5 px-2.5 text-[9.5px] rounded-md"
                            >
                                <GraduationCap size={11} />
                                <span>Completar Plan de Aprendizaje</span>
                            </button>
                        )}
                    </div>
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
