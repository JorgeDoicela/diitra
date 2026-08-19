import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileSignature, CheckCircle2, AlertCircle, FileText, GraduationCap } from 'lucide-react';
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
                    const protoDoc = res.data.find(
                        (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                                    d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
                    );
                    const protoOk = protoDoc ? (protoDoc.is_signed === true || protoDoc.isSigned === true || !!protoDoc.final_pdf_path || !!protoDoc.finalPdfPath || protoDoc.estado === 'Firmado') : false;
                    setIsProtocoloSigned(protoOk || ['Enviado', 'En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status));

                    const planDoc = res.data.find(
                        (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
                    );
                    const planOk = planDoc ? (planDoc.is_signed === true || planDoc.isSigned === true || !!planDoc.final_pdf_path || !!planDoc.finalPdfPath || planDoc.estado === 'Firmado') : false;
                    setIsPlanSigned(planOk || ['Enviado', 'En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(currentProject.status));
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

    const isAllSigned = (isProtocoloSigned && isPlanSigned) || (currentProject.status !== 'Borrador' && currentProject.status !== 'En Corrección');

    return (
        <div className="flex flex-col gap-3">
            {/* Banner de Revisión Técnica para el Administrador */}
            {isAdmin && currentProject.status === 'Enviado' && resolvedProjectUuid && isAllSigned && (
                <div className="bento-card static p-5 flex flex-col justify-between border border-brand/40 bg-brand/[0.02] shadow-md animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <Shield size={16} className="text-brand animate-pulse" />
                            <h3 className="text-xs font-black tracking-widest text-brand uppercase">Revisión Técnica Requerida</h3>
                        </div>
                        <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                            El expediente completo (Protocolo y Plan de Aprendizaje) ha sido remitido por el Director para su revisión técnica.
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
            {!isAdmin && currentProject.status === 'En Corrección' && (
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
            )}

            {/* Firmas de Expediente Institucional */}
            <div className="bento-card static p-5 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-text-main/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-text-main/8 transition-colors duration-500"></div>
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <Shield size={16} className="text-text-dim group-hover:text-text-main transition-colors" />
                        <h3 className="text-xs font-semibold tracking-widest text-text-main uppercase opacity-90">Instrumentos Requeridos</h3>
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed mt-1">
                        Para habilitar la revisión del Administrador, el Director debe firmar y enviar ambos documentos.
                    </p>
                </div>
                <div className="mt-4 space-y-3">
                    {/* 1. Protocolo de Investigación */}
                    <div className="p-3 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-brand shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-text-main">Protocolo de Investigación</p>
                                    <p className="text-[9px] text-text-dim">Documento base del proyecto</p>
                                </div>
                            </div>
                            {isProtocoloSigned ? (
                                <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-semibold" title="Firmado">
                                    <CheckCircle2 size={14} />
                                    <span>Firmado</span>
                                </span>
                            ) : (
                                <span className="text-[9px] font-semibold text-warning flex items-center gap-1">
                                    <span className="dot dot-warning dot-pulse" />
                                    Pendiente
                                </span>
                            )}
                        </div>
                        {!isProtocoloSigned && currentProject.puedeFirmar && setActiveDocument && (
                            <button
                                type="button"
                                onClick={() => setActiveDocument('PROTOCOLO_INVESTIGACION')}
                                className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-surface hover:bg-surface-hover border border-border-thin text-text-main text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                                <FileSignature size={11} />
                                <span>Firmar Protocolo</span>
                            </button>
                        )}
                    </div>

                    {/* 2. Plan de Aprendizaje */}
                    <div className="p-3 rounded-xl bg-bg-deep border border-border-thin hover:border-border-hover transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={14} className="text-brand shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-text-main">Plan de Aprendizaje</p>
                                    <p className="text-[9px] text-text-dim">Articulación docencia (APE)</p>
                                </div>
                            </div>
                            {isPlanSigned ? (
                                <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-semibold" title="Firmado">
                                    <CheckCircle2 size={14} />
                                    <span>Firmado</span>
                                </span>
                            ) : (
                                <span className="text-[9px] font-semibold text-warning flex items-center gap-1">
                                    <span className="dot dot-warning dot-pulse" />
                                    Pendiente
                                </span>
                            )}
                        </div>
                        {!isPlanSigned && currentProject.puedeFirmar && setActiveDocument && (
                            <button
                                type="button"
                                onClick={() => setActiveDocument('PLAN_APRENDIZAJE')}
                                className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-surface hover:bg-surface-hover border border-border-thin text-text-main text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                                <FileSignature size={11} />
                                <span>Firmar Plan de Aprendizaje</span>
                            </button>
                        )}
                    </div>

                    {!isAllSigned && !currentProject.puedeFirmar && (
                        <div className="p-2 bg-surface/60 rounded-lg border border-border-thin">
                            <p className="text-[9px] text-text-dim leading-relaxed text-center">
                                Esperando la firma electrónica del Director en ambos documentos para avanzar a la fase de Revisión Técnica.
                            </p>
                        </div>
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
