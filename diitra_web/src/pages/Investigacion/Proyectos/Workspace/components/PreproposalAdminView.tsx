import React, { useState, useRef, useCallback } from 'react';
import { Shield, Check, RotateCcw, MessageSquare } from 'lucide-react';
import WorkspaceHeader from './WorkspaceHeader';
import { ProjectTraceabilitySection } from './ProjectTraceabilitySection';
import { ObservationConnectors } from './ObservationConnectors';
import { parseObservation } from '../hooks/usePreproposalState';

interface PreproposalAdminViewProps {
    currentProject: any;
    isSidebarCollapsed: boolean;
    urlPrefix: string;
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
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [hoveredField, setHoveredField] = useState<string | null>(null);

    const isEvaluating = currentProject.status === 'Prepropuesta';
    const activeField = hoveredField || (isEvaluating && feedbackMode === 'secciones' ? activeSectionTab : null);

    const focusObservationInput = useCallback((mode: 'general' | 'secciones', tab?: 'carrera' | 'titulo' | 'descripcion' | 'presupuesto') => {
        setFeedbackMode(mode);
        if (tab) setActiveSectionTab(tab);
        setTimeout(() => {
            if (activeTextareaRef.current) {
                activeTextareaRef.current.focus();
                const len = activeTextareaRef.current.value.length;
                activeTextareaRef.current.setSelectionRange(len, len);
            }
        }, 50);
    }, [setFeedbackMode, setActiveSectionTab]);

    const isRejected = currentProject.status === 'Prepropuesta Rechazada';

    const ultimaObservacion = isRejected && !isLoadingTrazabilidad
        ? (trazabilidad.find(t => t.estadoNuevo === 'Prepropuesta Rechazada' || t.EstadoNuevo === 'Prepropuesta Rechazada')?.observacion || 'Sin observaciones especificadas.')
        : '';

    const parsedObs = isRejected ? parseObservation(ultimaObservacion) : {};

    // Observaciones históricas de la devolución previa (para contexto in situ del evaluador)
    const previousRejection = trazabilidad.find(
        t => t.estadoNuevo === 'Prepropuesta Rechazada' || t.EstadoNuevo === 'Prepropuesta Rechazada'
    );
    const previousObsParsed = previousRejection && !isLoadingTrazabilidad
        ? parseObservation(previousRejection.observacion ?? previousRejection.Observacion ?? '')
        : null;

    return (
        <div className="h-screen w-full flex flex-col bg-bg-deep overflow-y-auto pb-20 selection:bg-text-main selection:text-bg-deep">
            <WorkspaceHeader
                currentProject={currentProject}
                isSidebarCollapsed={isSidebarCollapsed}
                isPublishingDSpace={false}
                urlPrefix={urlPrefix}
                onExportCaces={() => { }}
                onPublishDSpace={() => { }}
            />

            <main ref={mainContainerRef} className="max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
                <ObservationConnectors
                    containerRef={mainContainerRef}
                    observations={parsedObs}
                    hoveredField={activeField}
                />
                {/* Panel Izquierdo: Contenido de la Prepropuesta */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-6">
                    <div
                        onClick={isEvaluating ? () => focusObservationInput('general') : undefined}
                        className={`p-8 space-y-6 rounded-2xl transition-all duration-200 bg-surface shadow-sm cursor-default ${isEvaluating && feedbackMode === 'general'
                            ? 'border-2 border-text-main ring-1 ring-text-main/20'
                            : 'border border-border-thin'
                            }`}
                    >
                        <div className="border-b border-border pb-4 flex justify-between items-center gap-4">
                            <div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Detalle de la Prepropuesta</h3>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Docente Proponente: {currentProject.directorProyecto || 'No asignado'}</p>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Convocatoria: {currentProject.convocatoria || 'No especificada'}</p>
                            </div>
                            {isEvaluating && feedbackMode === 'general' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shrink-0" />
                            )}
                        </div>

                        {/* Observación General (Prepropuesta Devuelta) */}
                        {!isEvaluating && parsedObs.general && (
                            <div
                                className="space-y-1"
                                data-field-anchor="general"
                                onMouseEnter={() => setHoveredField('general')}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div className="flex justify-between items-center cursor-default">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                                        Observación General
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'general'
                                        ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                        : 'text-error border border-transparent'
                                        }`}>
                                        Observado
                                    </span>
                                </div>
                                <p className="text-xs text-text-main leading-relaxed pl-3 whitespace-pre-wrap">
                                    {parsedObs.general}
                                </p>
                            </div>
                        )}

                        {/* Observación General Previa */}
                        {isEvaluating && previousObsParsed?.general && (
                            <div className="text-[11px] text-text-dim leading-relaxed pl-1">
                                <span className="font-semibold text-text-main text-[10px] uppercase tracking-wider mr-1.5">
                                    Observación general anterior:
                                </span>
                                <span className="italic">
                                    &ldquo;{previousObsParsed.general}&rdquo;
                                </span>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Carrera / Unidad Postulante */}
                            <div
                                onClick={isEvaluating ? (e) => {
                                    e.stopPropagation();
                                    focusObservationInput('secciones', 'carrera');
                                } : undefined}
                                onMouseEnter={() => setHoveredField('carrera')}
                                onMouseLeave={() => setHoveredField(null)}
                                className={`space-y-2 ${isEvaluating ? 'group cursor-pointer' : ''}`}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="carrera"
                                >
                                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isEvaluating ? 'text-text-dim cursor-pointer transition-colors group-hover:text-text-main' : 'text-text-dim'}`}>
                                        Carrera / Unidad Postulante
                                    </label>
                                    {isEvaluating && feedbackMode === 'secciones' && activeSectionTab === 'carrera' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                    {!isEvaluating && parsedObs.carrera && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'carrera'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep select-none transition-all duration-250 ${isEvaluating
                                    ? (feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'carrera')
                                        ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                        : 'opacity-70 group-hover:border-border')
                                    : (!parsedObs.carrera ? 'border-border-thin opacity-85' : 'border-error/30 bg-error/[0.01] opacity-90')
                                    }`}>
                                    {currentProject.carrera || 'No definida'}
                                </div>
                                {isEvaluating && previousObsParsed?.carrera && (
                                    <div className="text-[10px] text-text-dim leading-relaxed pl-1 pt-0.5">
                                        <span className="font-semibold text-text-main text-[9.5px] uppercase tracking-wider mr-1.5">
                                            Observación anterior:
                                        </span>
                                        <span className="italic">
                                            &ldquo;{previousObsParsed.carrera}&rdquo;
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Tema / Título de la Investigación */}
                            <div
                                onClick={isEvaluating ? (e) => {
                                    e.stopPropagation();
                                    focusObservationInput('secciones', 'titulo');
                                } : undefined}
                                onMouseEnter={() => setHoveredField('titulo')}
                                onMouseLeave={() => setHoveredField(null)}
                                className={`space-y-2 ${isEvaluating ? 'group cursor-pointer' : ''}`}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="titulo"
                                >
                                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isEvaluating ? 'text-text-dim cursor-pointer transition-colors group-hover:text-text-main' : 'text-text-dim'}`}>
                                        Tema / Título de la Investigación
                                    </label>
                                    {isEvaluating && feedbackMode === 'secciones' && activeSectionTab === 'titulo' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                    {!isEvaluating && parsedObs.titulo && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'titulo'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase transition-all duration-250 ${isEvaluating
                                    ? (feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'titulo')
                                        ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                        : 'opacity-85 group-hover:border-border')
                                    : (!parsedObs.titulo ? 'border-border-thin opacity-85' : 'border-error/30 bg-error/[0.01] opacity-90')
                                    }`}>
                                    {currentProject.title}
                                </div>
                                {isEvaluating && previousObsParsed?.titulo && (
                                    <div className="text-[10px] text-text-dim leading-relaxed pl-1 pt-0.5">
                                        <span className="font-semibold text-text-main text-[9.5px] uppercase tracking-wider mr-1.5">
                                            Observación anterior:
                                        </span>
                                        <span className="italic">
                                            &ldquo;{previousObsParsed.titulo}&rdquo;
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Descripción / Justificación detallada */}
                            <div
                                onClick={isEvaluating ? (e) => {
                                    e.stopPropagation();
                                    focusObservationInput('secciones', 'descripcion');
                                } : undefined}
                                onMouseEnter={() => setHoveredField('descripcion')}
                                onMouseLeave={() => setHoveredField(null)}
                                className={`space-y-2 ${isEvaluating ? 'group cursor-pointer' : ''}`}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="descripcion"
                                >
                                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isEvaluating ? 'text-text-dim cursor-pointer transition-colors group-hover:text-text-main' : 'text-text-dim'}`}>
                                        Descripción / Justificación detallada
                                    </label>
                                    {isEvaluating && feedbackMode === 'secciones' && activeSectionTab === 'descripcion' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                    {!isEvaluating && parsedObs.descripcion && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'descripcion'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[150px] !h-auto text-xs leading-relaxed transition-all duration-250 ${isEvaluating
                                    ? (feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'descripcion')
                                        ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                        : 'opacity-85 group-hover:border-border')
                                    : (!parsedObs.descripcion ? 'border-border-thin opacity-85' : 'border-error/30 bg-error/[0.01] opacity-90')
                                    }`}>
                                    {currentProject.descripcion || 'Sin descripción ingresada.'}
                                </div>
                                {isEvaluating && previousObsParsed?.descripcion && (
                                    <div className="text-[10px] text-text-dim leading-relaxed pl-1 pt-0.5">
                                        <span className="font-semibold text-text-main text-[9.5px] uppercase tracking-wider mr-1.5">
                                            Observación anterior:
                                        </span>
                                        <span className="italic">
                                            &ldquo;{previousObsParsed.descripcion}&rdquo;
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Presupuesto Estimado (USD) */}
                            <div
                                onClick={isEvaluating ? (e) => {
                                    e.stopPropagation();
                                    focusObservationInput('secciones', 'presupuesto');
                                } : undefined}
                                onMouseEnter={() => setHoveredField('presupuesto')}
                                onMouseLeave={() => setHoveredField(null)}
                                className={`space-y-2 ${isEvaluating ? 'group cursor-pointer' : ''}`}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="presupuesto"
                                >
                                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isEvaluating ? 'text-text-dim cursor-pointer transition-colors group-hover:text-text-main' : 'text-text-dim'}`}>
                                        Presupuesto Estimado (USD)
                                    </label>
                                    {isEvaluating && feedbackMode === 'secciones' && activeSectionTab === 'presupuesto' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                    )}
                                    {!isEvaluating && parsedObs.presupuesto && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'presupuesto'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                <div className={`input-vercel bg-bg-deep font-mono font-bold transition-all duration-250 ${isEvaluating
                                    ? (feedbackMode === 'general' || (feedbackMode === 'secciones' && activeSectionTab === 'presupuesto')
                                        ? 'border-text-main ring-2 ring-text-main shadow-md !opacity-100'
                                        : 'opacity-85 group-hover:border-border')
                                    : (!parsedObs.presupuesto ? 'border-border-thin opacity-85' : 'border-error/30 bg-error/[0.01] opacity-90')
                                    }`}>
                                    ${Number(currentProject.presupuesto).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                </div>
                                {isEvaluating && previousObsParsed?.presupuesto && (
                                    <div className="text-[10px] text-text-dim leading-relaxed pl-1 pt-0.5">
                                        <span className="font-semibold text-text-main text-[9.5px] uppercase tracking-wider mr-1.5">
                                            Observación anterior:
                                        </span>
                                        <span className="italic">
                                            &ldquo;{previousObsParsed.presupuesto}&rdquo;
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Panel de Evaluación o Historial */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-6">
                    {currentProject.status === 'Prepropuesta' ? (
                        <div className="bento-card static p-8 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md space-y-6">
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
                                        onClick={() => focusObservationInput('general')}
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
                                        onClick={() => focusObservationInput('secciones', activeSectionTab)}
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
                                            ref={activeTextareaRef}
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
                                                onClick={() => focusObservationInput('secciones', 'carrera')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'carrera' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Carrera
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => focusObservationInput('secciones', 'titulo')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'titulo' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Título
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => focusObservationInput('secciones', 'descripcion')}
                                                className={`pb-1.5 border-b-2 transition-all duration-200 ${activeSectionTab === 'descripcion' ? 'border-brand text-text-main font-black' : 'border-transparent text-text-dim'
                                                    }`}
                                            >
                                                Descripción
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => focusObservationInput('secciones', 'presupuesto')}
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
                                                    ref={activeTextareaRef}
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
                                                    ref={activeTextareaRef}
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
                                                    ref={activeTextareaRef}
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
                                                    ref={activeTextareaRef}
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
                        <div className="bento-card static p-8 rounded-2xl border border-border-thin shadow-sm space-y-6 bg-surface">
                            <div className="border-b border-border pb-4">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                    Prepropuesta Devuelta
                                </h3>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Esperando Correcciones del Docente</p>
                            </div>

                            {/* ── Desglose de Observaciones ── */}
                            <div className="space-y-5">
                                {/* 1. Observación General */}
                                {parsedObs.general && (
                                    <div
                                        data-comment-anchor="general"
                                        onMouseEnter={() => setHoveredField('general')}
                                        onMouseLeave={() => setHoveredField(null)}
                                        className={`space-y-1 transition-all rounded-md p-1.5 -ml-1.5 cursor-default ${activeField === 'general' ? 'bg-error/[0.05] ring-1 ring-error/20' : ''}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full bg-error shrink-0 transition-transform ${activeField === 'general' ? 'scale-125' : ''}`} />
                                            Observación General
                                        </span>
                                        <p className="text-xs text-text-main leading-relaxed pl-3 whitespace-pre-wrap">
                                            {parsedObs.general}
                                        </p>
                                    </div>
                                )}

                                {/* 2. Observaciones por Campo */}
                                {(() => {
                                    const specificList = [
                                        { key: 'carrera', label: 'Carrera / Unidad', text: parsedObs.carrera },
                                        { key: 'titulo', label: 'Tema / Título', text: parsedObs.titulo },
                                        { key: 'descripcion', label: 'Descripción / Justificación', text: parsedObs.descripcion },
                                        { key: 'presupuesto', label: 'Presupuesto Estimado', text: parsedObs.presupuesto },
                                    ].filter(item => Boolean(item.text));

                                    if (specificList.length === 0) return null;

                                    return (
                                        <div className="space-y-3 pt-1">
                                            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                                                Correcciones por Campo
                                            </h4>

                                            <div className="space-y-3.5 pl-1">
                                                {specificList.map((obs) => (
                                                    <div
                                                        key={obs.key}
                                                        data-comment-anchor={obs.key}
                                                        onMouseEnter={() => setHoveredField(obs.key)}
                                                        onMouseLeave={() => setHoveredField(null)}
                                                        className={`space-y-1 transition-all rounded-md p-1.5 -ml-1.5 cursor-default ${activeField === obs.key ? 'bg-error/[0.05] ring-1 ring-error/20' : ''}`}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-main flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform ${activeField === obs.key ? 'bg-error scale-125' : 'bg-error'}`} />
                                                            {obs.label}
                                                        </span>
                                                        <p className="text-xs text-text-dim leading-relaxed pl-3 whitespace-pre-wrap">
                                                            {obs.text}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Línea de tiempo siempre visible para el admin */}
                    <div className="bento-card static p-6 rounded-2xl border border-border-thin shadow-sm bg-surface">
                        <ProjectTraceabilitySection
                            trazabilidad={trazabilidad}
                            isLoadingTrazabilidad={isLoadingTrazabilidad}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
