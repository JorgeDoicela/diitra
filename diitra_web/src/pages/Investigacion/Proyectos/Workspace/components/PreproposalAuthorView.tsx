import React from 'react';
import { AlertTriangle } from 'lucide-react';
import WorkspaceHeader from './WorkspaceHeader';
import { ProjectTraceabilitySection } from './ProjectTraceabilitySection';
import { parseObservation, formatCurrency } from '../hooks/usePreproposalState';

interface PreproposalAuthorViewProps {
    currentProject: any;
    isSidebarCollapsed: boolean;
    urlPrefix: string;
    navigate: any;
    editTitulo: string;
    setEditTitulo: (val: string) => void;
    editDescripcion: string;
    setEditDescripcion: (val: string) => void;
    editPresupuesto: string;
    setEditPresupuesto: (val: string) => void;
    isSavingPreproposal: boolean;
    handleGuardarYReenviar: (titulo: string, descripcion: string, presupuesto: string) => Promise<void>;
    trazabilidad: any[];
    isLoadingTrazabilidad: boolean;
}

export const PreproposalAuthorView: React.FC<PreproposalAuthorViewProps> = ({
    currentProject,
    isSidebarCollapsed,
    urlPrefix,
    navigate,
    editTitulo,
    setEditTitulo,
    editDescripcion,
    setEditDescripcion,
    editPresupuesto,
    setEditPresupuesto,
    isSavingPreproposal,
    handleGuardarYReenviar,
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
                {/* Panel Izquierdo: Formulario */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bento-card p-8 space-y-6 rounded-2xl border border-border-thin shadow-sm">
                        <div className="border-b border-border pb-4 flex justify-between items-center">
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

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Carrera / Unidad Postulante</label>
                                <div className={`input-vercel opacity-70 bg-bg-deep select-none ${parsedObs.carrera ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.carrera || 'No definida'}</div>
                                {parsedObs.carrera && (
                                    <div className="mt-1.5 text-xs text-error font-medium flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200 ml-1">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Observación:</span> {parsedObs.carrera}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Tema / Título de la Investigación</label>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <textarea
                                        value={editTitulo}
                                        onChange={(e) => setEditTitulo(e.target.value.toUpperCase())}
                                        className={`input-vercel !h-20 !font-bold !text-xs uppercase resize-none ${parsedObs.titulo ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                    />
                                ) : (
                                    <div className={`input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[50px] !h-auto font-bold uppercase ${parsedObs.titulo ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.title}</div>
                                )}
                                {parsedObs.titulo && (
                                    <div className="mt-1.5 text-xs text-error font-medium flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200 ml-1">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Observación:</span> {parsedObs.titulo}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Descripción / Justificación detallada</label>
                                {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar ? (
                                    <div className="space-y-1.5">
                                        <textarea
                                            value={editDescripcion}
                                            onChange={(e) => setEditDescripcion(e.target.value)}
                                            className={`input-vercel !h-40 !text-xs resize-none ${parsedObs.descripcion ? 'border-error/40 ring-1 ring-error/20 shadow-sm' : ''}`}
                                        />
                                    </div>
                                ) : (
                                    <div className={`input-vercel opacity-80 bg-bg-deep whitespace-pre-wrap break-words leading-relaxed select-none min-h-[100px] !h-auto text-xs ${parsedObs.descripcion ? 'border-error/40 ring-1 ring-error/20' : ''}`}>{currentProject.descripcion || 'Sin descripción ingresada.'}</div>
                                )}
                                {parsedObs.descripcion && (
                                    <div className="mt-1.5 text-xs text-error font-medium flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200 ml-1">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Observación:</span> {parsedObs.descripcion}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Presupuesto Estimado (USD)</label>
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
                                    <div className="mt-1.5 text-xs text-error font-medium flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200 ml-1">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold">Observación:</span> {parsedObs.presupuesto}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {currentProject.status === 'Prepropuesta Rechazada' && currentProject.puedeEditar && (
                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    onClick={() => handleGuardarYReenviar(editTitulo, editDescripcion, editPresupuesto)}
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
                <div className="space-y-6">
                    {currentProject.status === 'Prepropuesta' && (
                        <div className="bento-card p-8 rounded-2xl border border-brand/20 bg-brand/[0.01] shadow-md space-y-4">
                            <div className="border-b border-border pb-4 flex items-center gap-2">
                                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">En Revisión</h3>
                            </div>
                            <p className="text-xs text-text-dim leading-relaxed">
                                Su propuesta de idea de investigación está bajo análisis de la Dirección de Investigación. Se le notificará en cuanto sea aprobada para proceder con el protocolo completo.
                            </p>
                        </div>
                    )}

                    {currentProject.status !== 'Prepropuesta' && (
                        <div className="bento-card p-8 rounded-2xl border border-error/20 bg-error/[0.01] shadow-md space-y-6">
                            <div className="border-b border-border pb-4">
                                <h3 className="text-sm font-black text-error uppercase tracking-widest flex items-center gap-2">
                                    Prepropuesta Devuelta
                                </h3>
                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">Esperando Correcciones</p>
                            </div>

                            <div className="bg-error/[0.02] border border-error/10 p-4 rounded-xl space-y-3">
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
