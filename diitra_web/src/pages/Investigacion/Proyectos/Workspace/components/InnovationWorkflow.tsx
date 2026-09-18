import React from 'react';
import { 
    FileText, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    Sparkles, 
    ShieldCheck, 
    Layers, 
    FileSignature
} from 'lucide-react';
import { DocumentTemplateRegistry } from '../../../../../core/documents/registry/DocumentTemplateRegistry';

interface InnovationWorkflowProps {
    currentProject: {
        status: string;
        puedeEditar: boolean;
        codigoInstitucional: string | null;
        uuid: string;
        convocatoria?: string;
        entidadAliada?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
        modalidad?: string;
        [key: string]: any;
    };
    projectDocuments?: any[];
    templateCode: string;
    isAdmin: boolean;
    resolvingDocument: string | null;
    urlPrefix: string;
    resolvedProjectUuid: string;
    setActiveDocument: (doc: string) => void;
    resolveDocumentInstance: (doc: string) => void;
    handleIniciarEjecucion?: () => void;
    navigate: (path: string) => void;
}

interface InnovationPhase {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    isCompleted: (status: string) => boolean;
    isCurrent: (status: string) => boolean;
}

const INNOVATION_PHASES: InnovationPhase[] = [
    {
        id: 'formulacion',
        title: 'Formulación y Viabilidad Técnica',
        subtitle: 'Elaboración del protocolo de innovación, propuesta de valor y requerimientos técnicos',
        icon: FileText,
        isCompleted: (status) => ['Enviado', 'Revisión Técnica', 'En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(status),
        isCurrent: (status) => ['Borrador', 'En Corrección'].includes(status)
    },
    {
        id: 'revision',
        title: 'Revisión y Aprobación Institucional',
        subtitle: 'Evaluación de viabilidad y dictamen por la Coordinación de Innovación / DIITRA',
        icon: ShieldCheck,
        isCompleted: (status) => ['Aprobado', 'En Ejecución', 'Finalizado'].includes(status),
        isCurrent: (status) => ['Enviado', 'Revisión Técnica', 'En Revisión'].includes(status)
    },
    {
        id: 'ejecucion',
        title: 'Desarrollo, Prototipado y Validación',
        subtitle: 'Construcción técnica, pruebas operativas y validación en entorno real',
        icon: Layers,
        isCompleted: (status) => status === 'Finalizado',
        isCurrent: (status) => status === 'En Ejecución'
    },
    {
        id: 'transferencia',
        title: 'Transferencia, Convenios y Cierre',
        subtitle: 'Informe final de innovación, formalización de convenios CTT o entrega a beneficiarios',
        icon: Sparkles,
        isCompleted: (status) => status === 'Finalizado',
        isCurrent: (status) => status === 'Finalizado'
    }
];

export const InnovationWorkflow: React.FC<InnovationWorkflowProps> = ({
    currentProject,
    projectDocuments = [],
    templateCode,
    setActiveDocument
}) => {
    const status = currentProject.status || 'Borrador';

    // Lista de documentos del proyecto
    // Si aún no se han cargado documentos en projectDocuments, aseguramos que al menos se muestre el protocolo base
    const documentsToShow = React.useMemo(() => {
        if (projectDocuments && projectDocuments.length > 0) {
            return projectDocuments;
        }
        return [
            {
                template_code: templateCode || 'PROTOCOLO_INNOVACION',
                templateCode: templateCode || 'PROTOCOLO_INNOVACION',
                uuid: currentProject?.uuid,
                title: 'Protocolo de Proyecto de Innovación',
                state: status === 'Borrador' ? 0 : 1,
                estado: status
            }
        ];
    }, [projectDocuments, templateCode, currentProject?.uuid, status]);

    const getDocumentInfo = (doc: any) => {
        const code = doc.template_code || doc.templateCode || 'PROTOCOLO_INNOVACION';
        const registry = DocumentTemplateRegistry[code];
        const title = registry?.title || doc.title || code.replace(/_/g, ' ');
        const subtitle = registry?.subtitle || 'Documento oficial vinculado al expediente de innovación';
        
        const isSigned = doc.is_signed === true || doc.isSigned === true || doc.state === 3 || doc.estado === 'Firmado' || Boolean(doc.final_pdf_path || doc.finalPdfPath);
        
        return {
            code,
            title,
            subtitle,
            isSigned
        };
    };

    const handleOpenDocument = (docCode: string) => {
        setActiveDocument(docCode);
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* 1. Panel de Documentos Oficiales del Proyecto (Componentes Reutilizables) */}
            <div className="bento-card static p-6 space-y-5 border border-border-thin bg-bg-surface shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-thin">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            <h3 className="text-sm font-semibold text-text-main tracking-tight">
                                Expediente Documental de Innovación
                            </h3>
                        </div>
                        <p className="text-xs text-text-dim">
                            Documentos oficiales institucionales que gobiernan el ciclo de vida de este proyecto.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="badge-vercel-neutral text-[11px] py-0.5 px-2.5 font-mono">
                            {documentsToShow.length} {documentsToShow.length === 1 ? 'Documento' : 'Documentos'}
                        </span>
                    </div>
                </div>

                {/* Grid de Tarjetas de Documentos Reutilizables */}
                <div className="grid grid-cols-1 gap-3.5">
                    {documentsToShow.map((doc: any, index: number) => {
                        const info = getDocumentInfo(doc);

                        return (
                            <div
                                key={doc.uuid || `${info.code}-${index}`}
                                className="group p-4 rounded-xl border border-border-thin bg-bg-deep/60 hover:bg-bg-deep hover:border-brand/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center text-text-main shrink-0 mt-0.5 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs font-semibold text-text-main group-hover:text-brand transition-colors truncate">
                                                {info.title}
                                            </h4>
                                            {info.isSigned ? (
                                                <span className="badge-vercel-success text-[10px] !py-0.5 !px-2 flex items-center gap-1 font-medium">
                                                    <FileSignature size={11} />
                                                    Firmado
                                                </span>
                                            ) : (
                                                <span className="badge-vercel-neutral text-[10px] !py-0.5 !px-2 flex items-center gap-1 font-medium">
                                                    <Clock size={11} />
                                                    {status === 'Borrador' ? 'En Formulación' : status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-text-dim line-clamp-1 leading-normal">
                                            {info.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDocument(info.code)}
                                        className="btn-vercel-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                                        title="Abrir en el Editor de Documentos de DIITRA"
                                    >
                                        <span>Abrir Documento</span>
                                        <ArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Stepper del Ciclo de Innovación (Desacoplado de CACES Investigación) */}
            <div className="bento-card static p-6 space-y-6 border border-border-thin bg-bg-surface shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-xs font-semibold tracking-wider text-text-dim uppercase font-mono">
                        Fases del Proceso de Innovación y Transferencia
                    </h3>
                    <p className="text-xs text-text-dim">
                        Maduración institucional desde la formulación técnica hasta la transferencia o validación del prototipo.
                    </p>
                </div>

                <div className="relative pl-6 space-y-5">
                    {/* Línea conectora */}
                    <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-border-thin" />

                    {INNOVATION_PHASES.map((phase, idx) => {
                        const isDone = phase.isCompleted(status);
                        const isCurrent = phase.isCurrent(status);

                        return (
                            <div key={phase.id} className="relative flex items-start gap-3.5 group">
                                {/* Nodo indicador */}
                                <div
                                    className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                        isDone
                                            ? 'bg-success text-white shadow-sm'
                                            : isCurrent
                                            ? 'bg-brand text-white ring-4 ring-brand/20'
                                            : 'bg-bg-deep border border-border-thin text-text-dim'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 size={12} strokeWidth={3} />
                                    ) : (
                                        <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                                    )}
                                </div>

                                {/* Contenido de la fase */}
                                <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4
                                            className={`text-xs font-semibold ${
                                                isCurrent
                                                    ? 'text-brand'
                                                    : isDone
                                                    ? 'text-text-main'
                                                    : 'text-text-dim'
                                            }`}
                                        >
                                            {phase.title}
                                        </h4>
                                        {isCurrent && (
                                            <span className="badge-vercel-brand text-[9px] !py-0.2 !px-1.5 font-medium">
                                                En Curso
                                            </span>
                                        )}
                                        {isDone && (
                                            <span className="badge-vercel-success text-[9px] !py-0.2 !px-1.5 font-medium">
                                                Completada
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-text-dim leading-relaxed">
                                        {phase.subtitle}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default InnovationWorkflow;
