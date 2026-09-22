import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Award, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { ActividadCronogramaItem, GuardarActividadPayload } from '../types/schedule.types';

interface ScheduleGanttTabProps {
  actividades: ActividadCronogramaItem[];
  canEdit: boolean;
  onSaveActividad: (payload: GuardarActividadPayload) => Promise<boolean>;
  onDeleteActividad: (actividadId: number) => Promise<boolean>;
  actionLoading?: boolean;
}

export const ScheduleGanttTab: React.FC<ScheduleGanttTabProps> = ({
  actividades,
  canEdit,
  onSaveActividad,
  onDeleteActividad,
  actionLoading = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [entregable, setEntregable] = useState('');
  const [recursosNecesarios, setRecursosNecesarios] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [esCaces, setEsCaces] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setDescripcion('');
    setResponsable('');
    setEntregable('');
    setRecursosNecesarios('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechaFin('');
    setEsCaces(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setFormError('La descripción de la actividad es requerida.');
      return;
    }

    const payload: GuardarActividadPayload = {
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || undefined,
      entregable: entregable.trim() || undefined,
      recursos_necesarios: recursosNecesarios.trim() || undefined,
      fecha_inicio_prevista: fechaInicio || undefined,
      fecha_fin_prevista: fechaFin || undefined,
      es_entregable_caces: esCaces,
      progreso: 0,
      ponderacion: 1
    };

    const ok = await onSaveActividad(payload);
    if (ok) {
      setIsModalOpen(false);
    }
  };

  const maxSemanas = Math.max(12, ...actividades.map(a => a.semanas?.length || 0));

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
            Matriz de Semanas y Actividades Planificadas (§7 Oficial CACES)
          </h4>
          <p className="text-[11px] text-text-dim">
            Estructura cronológica para la formulación, informes de avance y entrega de productos.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            disabled={actionLoading}
            className="btn-vercel-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Agregar Actividad</span>
          </button>
        )}
      </div>

      {/* Tabla Gantt con scroll horizontal */}
      <div className="border border-border-thin rounded-xl overflow-hidden bg-surface/50">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-border-thin bg-surface-hover/30 text-[10px] font-bold text-text-dim uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">N°</th>
                <th className="py-2.5 px-3 min-w-[220px]">Actividad / Objetivo</th>
                <th className="py-2.5 px-3 w-32">Responsable</th>
                <th className="py-2.5 px-3 w-28">Fechas</th>
                <th className="py-2.5 px-3 w-20 text-center">Avance</th>
                <th className="py-2.5 px-3 w-36">Entregable</th>
                <th className="py-2.5 px-3 min-w-[240px]">Gantt (Semanas)</th>
                {canEdit && <th className="py-2.5 px-3 w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-thin text-xs">
              {actividades.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="text-center py-8 text-text-dim text-xs">
                    No hay actividades registradas en el cronograma.
                  </td>
                </tr>
              ) : (
                actividades.map((act) => {
                  const idAct = act.id_actividad ?? act.idActividad ?? 0;
                  const num = act.numero_actividad ?? act.numeroActividad ?? 1;
                  const esCacesAct = act.es_entregable_caces ?? act.esEntregableCaces;
                  const semanas = act.semanas || Array(maxSemanas).fill(false);

                  return (
                    <tr key={act.uuid || idAct} className="hover:bg-surface-hover/20 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-text-dim text-[11px]">
                        {num}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-text-main text-xs">{act.descripcion}</div>
                        {(act.objetivo_descripcion || act.objetivoDescripcion) && (
                          <div className="text-[10px] text-text-dim mt-0.5 line-clamp-1">
                            {act.objetivo_descripcion || act.objetivoDescripcion}
                          </div>
                        )}
                        {esCacesAct && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 mt-1">
                            <Award size={11} /> Entregable CACES
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-text-dim">
                        {act.responsable || <span className="italic">Por asignar</span>}
                      </td>
                      <td className="py-2.5 px-3 text-[10px] font-mono text-text-dim whitespace-nowrap">
                        {act.fecha_inicio_prevista || act.fechaInicioPrevista ? (
                          <>
                            <div>{act.fecha_inicio_prevista || act.fechaInicioPrevista}</div>
                            <div className="text-[9px] text-text-dim/60">a {act.fecha_fin_prevista || act.fechaFinPrevista || '...'}</div>
                          </>
                        ) : (
                          <span className="italic">S/F</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          act.progreso >= 100 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' 
                            : act.progreso > 0
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                            : 'bg-surface-hover text-text-dim'
                        }`}>
                          {act.progreso}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-text-dim">
                        {act.entregable || <span className="italic text-text-dim/50">Pendiente</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        {/* Bloques de semanas tipo Gantt */}
                        <div className="flex flex-wrap gap-1 items-center">
                          {semanas.slice(0, 16).map((isPlanned: boolean, wIdx: number) => (
                            <div
                              key={wIdx}
                              title={`Semana ${wIdx + 1}: ${isPlanned ? 'Planificada' : 'Sin actividad'}`}
                              className={`w-4 h-4 rounded text-[7px] font-mono flex items-center justify-center font-bold ${
                                isPlanned
                                  ? act.progreso >= 100
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-brand text-white shadow-xs'
                                  : 'border border-border-thin/50 text-text-dim/30'
                              }`}
                            >
                              {wIdx + 1}
                            </div>
                          ))}
                          {semanas.length > 16 && (
                            <span className="text-[9px] text-text-dim font-mono">+{semanas.length - 16}s</span>
                          )}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => idAct && onDeleteActividad(idAct)}
                            disabled={actionLoading}
                            className="p-1 text-text-dim hover:text-red-500 transition-colors"
                            title="Eliminar actividad"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Actividad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bento-card bg-surface w-full max-w-md p-6 space-y-4 shadow-xl border border-border-thin animate-scale-in">
            <div className="flex justify-between items-center border-b border-border-thin pb-3">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Calendar size={16} /> Nueva Actividad del Cronograma
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-dim hover:text-text-main text-xs"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                  Descripción de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Levantamiento de requerimientos y cotizaciones"
                  className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                    Fecha Inicio Prevista
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                    Fecha Fin Prevista
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Docente / Estudiante"
                    className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                    Entregable Comprometido
                  </label>
                  <input
                    type="text"
                    value={entregable}
                    onChange={(e) => setEntregable(e.target.value)}
                    placeholder="Documento / Prototipo"
                    className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                  Recursos Necesarios Asociados (Presupuesto)
                </label>
                <input
                  type="text"
                  value={recursosNecesarios}
                  onChange={(e) => setRecursosNecesarios(e.target.value)}
                  placeholder="Ej: Equipos de medición, reactivos, licencias"
                  className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={esCaces}
                  onChange={(e) => setEsCaces(e.target.checked)}
                  className="rounded border-border-thin text-brand focus:ring-brand"
                />
                <span className="text-[11px] text-text-main font-medium">
                  Es un Entregable Clave para Auditoría CACES
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-thin">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-vercel-secondary text-xs px-3 py-1.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-vercel-primary text-xs px-4 py-1.5"
                >
                  Guardar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
