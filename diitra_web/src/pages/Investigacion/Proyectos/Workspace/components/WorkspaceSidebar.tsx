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
