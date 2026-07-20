import React from 'react';
import { Shield, Check, RotateCcw, MessageSquare } from 'lucide-react';
import WorkspaceHeader from './WorkspaceHeader';
import { ProjectTraceabilitySection } from './ProjectTraceabilitySection';
import { parseObservation } from '../hooks/usePreproposalState';

interface PreproposalAdminViewProps {
    currentProject: any;
    isSidebarCollapsed: boolean;
    urlPrefix: string;
    navigate: any;
    feedbackMode: 'general' | 'secciones';
    setFeedbackMode: (mode: 'general' | 'secciones') => void;
    activeSectionTab: 'carrera' | 'titulo' | 'descripcion' | 'presupuesto';
    setActiveSectionTab: (tab: 'carrera' | 'titulo' | 'descripcion' | 'presupuesto') => void;
    adminObservation: string;
    setAdminObservation: (val: string) => void;
    sectionObservations: {
        carrera: string;
        titulo: string;
        descripcion: string;
        presupuesto: string;
    };
    setSectionObservations: React.Dispatch<React.SetStateAction<{
        carrera: string;
        titulo: string;
        descripcion: string;
        presupuesto: string;
    }>>;
    isSubmittingAdminReview: boolean;
    handleAdminAprobarPrepropuesta: () => Promise<void>;
    handleAdminDevolverPrepropuesta: () => Promise<void>;
    trazabilidad: any[];
    isLoadingTrazabilidad: boolean;
}

export const PreproposalAdminView: React.FC<PreproposalAdminViewProps> = ({
    currentProject,
    isSidebarCollapsed,
    urlPrefix,
    navigate,
    feedbackMode,
    setFeedbackMode,
    activeSectionTab,
    setActiveSectionTab,
    adminObservation,
    setAdminObservation,
    sectionObservations,
    setSectionObservations,
    isSubmittingAdminReview,
    handleAdminAprobarPrepropuesta,
    handleAdminDevolverPrepropuesta,
    trazabilidad,
    isLoadingTrazabilidad
}) => {
    const ultimaObservacion = isLoadingTrazabilidad
        ? "Cargando observaciones..."
        : (trazabilidad.find(t => t.estadoNuevo === 'Prepropuesta Rechazada' || t.EstadoNuevo === 'Prepropuesta Rechazada')?.observacion || 'Sin observaciones especificadas.');

    const parsedObs = parseObservation(ultimaObservacion);

    return (
        <div className="h-screen w-full flex flex-col bg-bg-deep overflow-y-auto pb-20 selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <WorkspaceHeader
                currentProject={currentProject}
                isSidebarCollapsed={isSidebarCollapsed}
                isPublishingDSpace={false}
                urlPrefix={urlPrefix}
                navigate={navigate}
                onExportCaces={() => { }}
                onPublishDSpace={() => { }}
            />

            <main className="max-w-6xl mx-auto p-6 md:p-12 animate-fade-up w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel Izquierdo: Contenido de la Prepropuesta */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        onClick={() => setFeedbackMode('general')}
                        className={`bento-card relative p-8 space-y-6 rounded-2xl border transition-all duration-300 bg-surface cursor-default ${feedbackMode === 'general'
                            ? '!border-text-main !ring-2 !ring-text-main shadow-md'
                            : 'border-border-thin shadow-sm'
                            }`}
                    >
                        {feedbackMode === 'general' && (
                            <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                        )}
                        <div className="border-b border-border pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Detalle de la Prepropuesta</h3>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Docente Proponente: {currentProject.directorProyecto || 'No asignado'}</p>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Convocatoria: {currentProject.convocatoria || 'No especificada'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Carrera / Unidad Postulante */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackMode('secciones');
                                    setActiveSectionTab('carrera');
                                }}
                                className="space-y-2 group cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 cursor-pointer transition-colors group-hover:text-text-main">
                                        Carrera / Unidad Postulante
                                    </label>
                                    {feedbackMode === 'secciones' && activeSectionTab === 'carrera' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep select-none transition-all duration-250 ${feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'carrera')
                                    ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                    : 'opacity-70 group-hover:border-border'
                                    }`}>
                                    {currentProject.carrera || 'No definida'}
                                </div>
                            </div>

                            {/* Tema / Título de la Investigación */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackMode('secciones');
                                    setActiveSectionTab('titulo');
                                }}
                                className="space-y-2 group cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 cursor-pointer transition-colors group-hover:text-text-main">
                                        Tema / Título de la Investigación
                                    </label>
                                    {feedbackMode === 'secciones' && activeSectionTab === 'titulo' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase transition-all duration-250 ${feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'titulo')
                                    ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                    : 'opacity-85 group-hover:border-border'
                                    }`}>
                                    {currentProject.title}
                                </div>
                            </div>

                            {/* Descripción / Justificación detallada */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackMode('secciones');
                                    setActiveSectionTab('descripcion');
                                }}
                                className="space-y-2 group cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 cursor-pointer transition-colors group-hover:text-text-main">
                                        Descripción / Justificación detallada
                                    </label>
                                    {feedbackMode === 'secciones' && activeSectionTab === 'descripcion' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[150px] !h-auto text-xs leading-relaxed transition-all duration-250 ${feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'descripcion')
                                    ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                    : 'opacity-85 group-hover:border-border'
                                    }`}>
                                    {currentProject.descripcion || 'Sin descripción ingresada.'}
                                </div>
                            </div>

                            {/* Presupuesto Estimado (USD) */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackMode('secciones');
                                    setActiveSectionTab('presupuesto');
                                }}
                                className="space-y-2 group cursor-pointer"
                            >
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1 cursor-pointer transition-colors group-hover:text-text-main">
                                        Presupuesto Estimado (USD)
                                    </label>
                                    {feedbackMode === 'secciones' && activeSectionTab === 'presupuesto' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep font-mono font-bold transition-all duration-250 ${feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'presupuesto')
                                    ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                    : 'opacity-85 group-hover:border-border'
                                    }`}>
                                    ${Number(currentProject.presupuesto).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Panel de Evaluación o Historial */}
                <div className="space-y-6">
                    {currentProject.status === 'Prepropuesta' ? (
                        <div className="bento-card p-8 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md space-y-6">
                            <div className="border-b border-border pb-4">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    Panel de Evaluación
                                </h3>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Revisión de Idea de Investigación</p>
                            </div>

                            <div className="space-y-4">
                                {/* Selector de Modo de Retroalimentación */}
                                <div className="flex border border-border-thin rounded-lg overflow-hidden shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackMode('general')}
                                        className={`flex-1 py-2 px-3 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 border-r border-border-thin ${feedbackMode === 'general'
                                            ? 'bg-text-main text-bg-deep font-black shadow-sm'
                                            : 'bg-surface text-text-dim hover:text-text-main hover:bg-bg-deep'
                                            }`}
                                    >
                                        <Shield size={10} />
                                        General
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFeedbackMode('secciones')}
                                        className={`flex-1 py-2 px-3 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${feedbackMode === 'secciones'
                                            ? 'bg-text-main text-bg-deep font-black shadow-sm'
                                            : 'bg-surface text-text-dim hover:text-text-main hover:bg-bg-deep'
                                            }`}
                                    >
                                        <MessageSquare size={10} />
                                        Por Secciones
                                    </button>
                                </div>

                                {feedbackMode === 'general' ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones Generales</label>
                                        <textarea
                                            key="general-obs"
                                            value={adminObservation}
                                            onChange={(e) => setAdminObservation(e.target.value)}
                                            placeholder="Ingrese las observaciones sobre el tema o justificación de la idea..."
                                            className="input-vercel !h-32 !text-xs resize-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        {/* Sub-selector de sección minimalista */}
                                        <div className="flex border-b border-border-thin text-[9px] font-bold uppercase tracking-wider mb-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionTab('carrera')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'carrera' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Carrera
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionTab('titulo')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'titulo' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Título
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionTab('descripcion')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'descripcion' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Descripción
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSectionTab('presupuesto')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'presupuesto' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Presupuesto
                                            </button>
                                        </div>

                                        {activeSectionTab === 'carrera' && (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones sobre Carrera / Unidad</label>
                                                <textarea
                                                    key="carrera-obs"
                                                    value={sectionObservations.carrera}
                                                    onChange={(e) => setSectionObservations({ ...sectionObservations, carrera: e.target.value })}
                                                    placeholder="Ingrese las observaciones sobre la carrera o unidad postulante..."
                                                    className="input-vercel !h-32 !text-xs resize-none"
                                                />
                                            </div>
                                        )}
                                        {activeSectionTab === 'titulo' && (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones sobre Tema / Título</label>
                                                <textarea
                                                    key="titulo-obs"
                                                    value={sectionObservations.titulo}
                                                    onChange={(e) => setSectionObservations({ ...sectionObservations, titulo: e.target.value })}
                                                    placeholder="Ingrese las observaciones sobre el tema o título..."
                                                    className="input-vercel !h-32 !text-xs resize-none"
                                                />
                                            </div>
                                        )}
                                        {activeSectionTab === 'descripcion' && (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones sobre Descripción / Justificación</label>
                                                <textarea
                                                    key="descripcion-obs"
                                                    value={sectionObservations.descripcion}
                                                    onChange={(e) => setSectionObservations({ ...sectionObservations, descripcion: e.target.value })}
                                                    placeholder="Ingrese las observaciones sobre la descripción..."
                                                    className="input-vercel !h-32 !text-xs resize-none"
                                                />
                                            </div>
                                        )}
                                        {activeSectionTab === 'presupuesto' && (
                                            <div className="space-y-2 animate-in fade-in duration-200">
                                                <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest ml-1">Observaciones sobre Presupuesto</label>
                                                <textarea
                                                    key="presupuesto-obs"
                                                    value={sectionObservations.presupuesto}
                                                    onChange={(e) => setSectionObservations({ ...sectionObservations, presupuesto: e.target.value })}
                                                    placeholder="Ingrese las observaciones sobre el presupuesto estimado..."
                                                    className="input-vercel !h-32 !text-xs resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    <button
                                        onClick={handleAdminAprobarPrepropuesta}
                                        disabled={isSubmittingAdminReview}
                                        className="w-full flex items-center justify-center gap-2 btn-vercel-primary py-3 px-6 text-xs font-bold uppercase tracking-wider"
                                    >
                                        <Check size={14} />
                                        Aprobar Prepropuesta
                                    </button>

                                    <button
                                        onClick={handleAdminDevolverPrepropuesta}
                                        disabled={
                                            isSubmittingAdminReview ||
                                            (feedbackMode === 'general'
                                                ? !adminObservation.trim()
                                                : !(sectionObservations.carrera.trim() || sectionObservations.titulo.trim() || sectionObservations.descripcion.trim() || sectionObservations.presupuesto.trim()))
                                        }
                                        className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-error/10 text-error border border-error/30 hover:border-error/50 rounded-lg py-3 px-6 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <RotateCcw size={14} />
                                        Devolver al Docente
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bento-card p-8 rounded-2xl border border-border-thin shadow-sm space-y-6 bg-surface">
                            <div className="border-b border-border pb-4">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    Prepropuesta Devuelta
                                </h3>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Esperando Correcciones</p>
                            </div>

                            <div className="bg-error/[0.02] border border-error/20 p-4 rounded-xl space-y-3">
                                <h4 className="text-[10px] font-bold text-error uppercase tracking-wider">Observaciones Generales del Administrador:</h4>
                                <div className="space-y-3">
                                    {parsedObs.general && (
                                        <div className="text-[11px] leading-relaxed pl-1">
                                            <span className="font-bold text-error text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0 animate-pulse" />
                                                General
                                            </span>
                                            <p className="text-xs text-text-main italic font-mono leading-relaxed break-words whitespace-pre-wrap pl-3">{parsedObs.general}</p>
                                        </div>
                                    )}
                                    {parsedObs.carrera && (
                                        <div className="text-[11px] leading-relaxed pl-1">
                                            <span className="font-bold text-error text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                                Carrera / Unidad
                                            </span>
                                            <span className="text-text-main italic font-mono block pl-3">{parsedObs.carrera}</span>
                                        </div>
                                    )}
                                    {parsedObs.titulo && (
                                        <div className="text-[11px] leading-relaxed pl-1">
                                            <span className="font-bold text-error text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                                Tema / Título
                                            </span>
                                            <span className="text-text-main italic font-mono block pl-3">{parsedObs.titulo}</span>
                                        </div>
                                    )}
                                    {parsedObs.descripcion && (
                                        <div className="text-[11px] leading-relaxed pl-1">
                                            <span className="font-bold text-error text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                                Descripción / Justificación
                                            </span>
                                            <span className="text-text-main italic font-mono block pl-3">{parsedObs.descripcion}</span>
                                        </div>
                                    )}
                                    {parsedObs.presupuesto && (
                                        <div className="text-[11px] leading-relaxed pl-1">
                                            <span className="font-bold text-error text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                                Presupuesto
                                            </span>
                                            <span className="text-text-main italic font-mono block pl-3">{parsedObs.presupuesto}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <ProjectTraceabilitySection
                                trazabilidad={trazabilidad}
                                isLoadingTrazabilidad={isLoadingTrazabilidad}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
