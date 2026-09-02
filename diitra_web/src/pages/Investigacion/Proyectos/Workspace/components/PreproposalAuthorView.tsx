import React, { useState, useRef } from 'react';

import WorkspaceHeader from './WorkspaceHeader';
import { ProjectTraceabilitySection } from './ProjectTraceabilitySection';
import { ObservationConnectors } from './ObservationConnectors';
import { parseObservation, formatCurrency } from '../hooks/usePreproposalState';

interface PreproposalAuthorViewProps {
    currentProject: any;
    isSidebarCollapsed: boolean;
    urlPrefix: string;
    editTitulo: string;
    setEditTitulo: (val: string) => void;
    editDescripcion: string;
    setEditDescripcion: (val: string) => void;
    editPresupuesto: string;
    setEditPresupuesto: (val: string) => void;
    docenteCarreras?: any[];
    editIdCarrera?: number;
    setEditIdCarrera?: (val: number) => void;
    isSavingPreproposal: boolean;
    handleGuardarYReenviar: (titulo: string, descripcion: string, presupuesto: string, idCarrera?: number) => Promise<void>;
    trazabilidad: any[];
    isLoadingTrazabilidad: boolean;
}

export const PreproposalAuthorView: React.FC<PreproposalAuthorViewProps> = ({
    currentProject,
    isSidebarCollapsed,
    urlPrefix,
    editTitulo,
    setEditTitulo,
    editDescripcion,
    setEditDescripcion,
    editPresupuesto,
    setEditPresupuesto,
    docenteCarreras,
    editIdCarrera,
    setEditIdCarrera,
    isSavingPreproposal,
    handleGuardarYReenviar,
    trazabilidad,
    isLoadingTrazabilidad
}) => {
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredField, setHoveredField] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const activeField = focusedField || hoveredField;

    const isRejected = currentProject.status === 'Prepropuesta Rechazada';

    const ultimaObservacion = isRejected && !isLoadingTrazabilidad
        ? (trazabilidad.find(t => t.estadoNuevo === 'Prepropuesta Rechazada' || t.EstadoNuevo === 'Prepropuesta Rechazada')?.observacion || 'Sin observaciones especificadas.')
        : '';

    const parsedObs = isRejected ? parseObservation(ultimaObservacion) : {};

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
                {/* Panel Izquierdo: Formulario */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-6">
                    <div className="bento-card static p-8 space-y-6 rounded-2xl border border-border-thin shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Datos de la Prepropuesta</h3>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Docente Proponente: {currentProject.directorProyecto || 'No asignado'}</p>
                                <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Convocatoria: {currentProject.convocatoria || 'No especificada'}</p>
                            </div>
                            {!currentProject.puedeEditar && (
                                <span className="text-[9px] font-bold bg-surface border border-border-thin text-text-dim px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Modo Lectura
                                </span>
                            )}
                        </div>

                        {/* Observación General */}
                        {parsedObs.general && (
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

                        <div className="space-y-6">
                            <div
                                className="space-y-2"
                                onMouseEnter={() => setHoveredField('carrera')}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="carrera"
                                >
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Carrera / Unidad Postulante</label>
                                    {parsedObs.carrera && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'carrera'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar && docenteCarreras && docenteCarreras.length > 1 ? (
                                    <select
                                        value={editIdCarrera || 0}
                                        onChange={(e) => setEditIdCarrera?.(Number(e.target.value))}
                                        onFocus={() => setFocusedField('carrera')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`input-vercel !text-xs !font-bold uppercase ${parsedObs.carrera ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                    >
                                        <option value={0} disabled>Seleccione una carrera...</option>
                                        {docenteCarreras.map((c: any) => {
                                            const cId = c.idCarrera ?? c.id_carrera ?? 0;
                                            const cName = c.carrera1 ?? c.nombre_carrera ?? c.carrera ?? 'Sin Nombre';
                                            return (
                                                <option key={cId} value={cId} className="bg-bg-deep text-text-main">
                                                    {cName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <div className={`input-vercel opacity-70 bg-bg-deep select-none ${parsedObs.carrera ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.carrera || 'No definida'}</div>
                                )}
                                {parsedObs.carrera && (
                                    <div className="mt-1.5 text-xs text-error font-medium ml-1">
                                        <span className="font-bold">Observación:</span> {parsedObs.carrera}
                                    </div>
                                )}
                            </div>

                            <div
                                className="space-y-2"
                                onMouseEnter={() => setHoveredField('titulo')}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="titulo"
                                >
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tema / Título de la Investigación</label>
                                    {parsedObs.titulo && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'titulo'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <textarea
                                        value={editTitulo}
                                        onChange={(e) => setEditTitulo(e.target.value.toUpperCase())}
                                        onFocus={() => setFocusedField('titulo')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`input-vercel !h-20 !font-bold !text-xs uppercase resize-none ${parsedObs.titulo ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                    />
                                ) : (
                                    <div className={`input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase ${parsedObs.titulo ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.title}</div>
                                )}
                                {parsedObs.titulo && (
                                    <div className="mt-1.5 text-xs text-error font-medium ml-1">
                                        <span className="font-bold">Observación:</span> {parsedObs.titulo}
                                    </div>
                                )}
                            </div>

                            <div
                                className="space-y-2"
                                onMouseEnter={() => setHoveredField('descripcion')}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="descripcion"
                                >
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Descripción / Justificación detallada</label>
                                    {parsedObs.descripcion && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'descripcion'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <div className="space-y-1.5">
                                        <textarea
                                            value={editDescripcion}
                                            onChange={(e) => setEditDescripcion(e.target.value)}
                                            onFocus={() => setFocusedField('descripcion')}
                                            onBlur={() => setFocusedField(null)}
                                            className={`input-vercel !h-40 !text-xs resize-none ${parsedObs.descripcion ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                        />
                                    </div>
                                ) : (
                                    <div className={`input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[100px] !h-auto text-xs ${parsedObs.descripcion ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.descripcion || 'Sin descripción ingresada.'}</div>
                                )}
                                {parsedObs.descripcion && (
                                    <div className="mt-1.5 text-xs text-error font-medium ml-1">
                                        <span className="font-bold">Observación:</span> {parsedObs.descripcion}
                                    </div>
                                )}
                            </div>

                            <div
                                className="space-y-2"
                                onMouseEnter={() => setHoveredField('presupuesto')}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div
                                    className="flex justify-between items-center cursor-default"
                                    data-field-anchor="presupuesto"
                                >
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Presupuesto Estimado (USD)</label>
                                    {parsedObs.presupuesto && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 px-2 py-0.5 rounded ${activeField === 'presupuesto'
                                            ? 'bg-error/10 border border-error/25 text-error shadow-sm'
                                            : 'text-error border border-transparent'
                                            }`}>
                                            Observado
                                        </span>
                                    )}
                                </div>
                                {currentProject.status === 'Prepropuesta' || !currentProject.puedeEditar ? (
                                    <div className={`input-vercel bg-bg-deep font-mono font-bold select-none ${parsedObs.presupuesto ? 'border-error/40 ring-1 ring-error/20' : ''}`}>
                                        ${Number(currentProject.presupuesto || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                    </div>
                                ) : (
                                    <div className="space-y-2 w-full">
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3 text-xs font-bold text-text-dim/60 select-none">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={editPresupuesto}
                                                onChange={(e) => setEditPresupuesto(e.target.value)}
                                                onFocus={() => setFocusedField('presupuesto')}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="15000.00"
                                                className={`input-vercel !pl-7 !font-bold !text-xs ${parsedObs.presupuesto ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                                required
                                            />
                                        </div>
                                        {editPresupuesto && !isNaN(parseFloat(editPresupuesto)) && parseFloat(editPresupuesto) > 0 && (
                                            <div className="text-[11px] font-medium text-text-dim/90 ml-1 mt-1.5 p-2 bg-bg-deep/80 border border-border-thin rounded animate-fade-in w-fit">
                                                <span>Valor: {formatCurrency(editPresupuesto)} USD</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {parsedObs.presupuesto && (
                                    <div className="mt-1.5 text-xs text-error font-medium ml-1">
                                        <span className="font-bold">Observación:</span> {parsedObs.presupuesto}
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar && (
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    onClick={() => handleGuardarYReenviar(editTitulo, editDescripcion, editPresupuesto, editIdCarrera)}
                                    disabled={isSavingPreproposal || !editDescripcion.trim() || !editTitulo.trim() || !editPresupuesto.trim()}
                                    className="btn-vercel-primary py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingPreproposal ? "Guardando..." : "Corregir y Reenviar Prepropuesta"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Estado, Observaciones y Trazabilidad */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-6">
                    {currentProject.status === 'Prepropuesta' && (
                        <div className="bento-card static p-8 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md space-y-4">
                            <div className="border-b border-border pb-4 flex items-center gap-2">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">En Revisión</h3>
                            </div>
                            <p className="text-xs text-text-dim leading-relaxed">
                                Su propuesta de idea de investigación está bajo análisis de la Dirección de Investigación. Se le notificará en cuanto sea aprobada para proceder con el protocolo completo.
                            </p>
                        </div>
                    )}

                    {isRejected && (
                        <div className="bento-card static p-8 rounded-2xl border border-error/20 bg-error/[0.01] shadow-md space-y-6">
                            <div className="border-b border-border pb-4">
                                <h3 className="text-sm font-black text-error uppercase tracking-widest flex items-center gap-2">
                                    Prepropuesta Devuelta
                                </h3>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Esperando Correcciones</p>
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
                                                Correcciones Solicitadas por Campo
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

                    <ProjectTraceabilitySection
                        trazabilidad={trazabilidad}
                        isLoadingTrazabilidad={isLoadingTrazabilidad}
                    />
                </div>
            </main>
        </div>
    );
};
