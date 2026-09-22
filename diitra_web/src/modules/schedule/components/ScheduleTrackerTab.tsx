import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, FileCheck, ArrowRight, Save, Award } from 'lucide-react';
import type { ActividadCronogramaItem, ActualizarProgresoPayload } from '../types/schedule.types';

interface ScheduleTrackerTabProps {
  actividades: ActividadCronogramaItem[];
  canEdit: boolean;
  onUpdateProgreso: (actividadId: number, payload: ActualizarProgresoPayload) => Promise<boolean>;
  actionLoading?: boolean;
}

export const ScheduleTrackerTab: React.FC<ScheduleTrackerTabProps> = ({
  actividades,
  canEdit,
  onUpdateProgreso,
  actionLoading = false
}) => {
  const [activeEditingId, setActiveEditingId] = useState<number | null>(null);
  const [editingProgreso, setEditingProgreso] = useState<number>(0);
  const [editingEntregable, setEditingEntregable] = useState<string>('');

  const startEdit = (act: ActividadCronogramaItem) => {
    const id = act.id_actividad ?? act.idActividad ?? 0;
    setActiveEditingId(id);
    setEditingProgreso(act.progreso ?? 0);
    setEditingEntregable(act.entregable || '');
  };

  const handleSave = async (actividadId: number) => {
    const ok = await onUpdateProgreso(actividadId, {
      progreso: editingProgreso,
      entregable: editingEntregable.trim() || undefined
    });
    if (ok) {
      setActiveEditingId(null);
    }
  };

  const handleQuickPercent = (val: number) => {
    setEditingProgreso(val);
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <div>
        <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
          Monitoreo de Avance y Entregables en Ejecución
        </h4>
        <p className="text-[11px] text-text-dim">
          Actualiza el porcentaje de cumplimiento real de cada actividad para alimentar automáticamente los informes de avance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {actividades.length === 0 ? (
          <div className="p-8 border border-border-thin rounded-xl text-center text-text-dim text-xs">
            No hay actividades registradas en el cronograma.
          </div>
        ) : (
          actividades.map((act) => {
            const idAct = act.id_actividad ?? act.idActividad ?? 0;
            const num = act.numero_actividad ?? act.numeroActividad ?? 1;
            const isEditing = activeEditingId === idAct;
            const esCacesAct = act.es_entregable_caces ?? act.esEntregableCaces;

            const estadoConfig = {
              COMPLETADA: { label: 'Completada', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
              EN_CURSO: { label: 'En Curso', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', icon: Clock },
              ATRASADA: { label: 'Con Retraso', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: AlertTriangle },
              PENDIENTE: { label: 'Pendiente', color: 'text-text-dim bg-surface border-border-thin', icon: Clock }
            }[act.estado] || { label: 'Pendiente', color: 'text-text-dim bg-surface border-border-thin', icon: Clock };

            const EstadoIcon = estadoConfig.icon;

            return (
              <div
                key={act.uuid || idAct}
                className={`p-4 rounded-xl border transition-all ${
                  isEditing
                    ? 'border-brand bg-surface shadow-xs'
                    : 'border-border-thin bg-surface/40 hover:bg-surface/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-thin/50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-hover font-mono text-[10px] font-bold flex items-center justify-center text-text-dim">
                      {num}
                    </span>
                    <h5 className="font-semibold text-text-main text-xs">{act.descripcion}</h5>
                    {esCacesAct && (
                      <span className="badge-vercel badge-vercel-warning text-[9px] flex items-center gap-1 font-bold">
                        <Award size={10} /> CACES
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoConfig.color}`}>
                      <EstadoIcon size={11} /> {estadoConfig.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-text-main">
                      {act.progreso}%
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-text-dim">
                      <span><strong>Responsable:</strong> {act.responsable || 'Equipo'}</span>
                      <span>•</span>
                      <span><strong>Plazo:</strong> {act.fecha_inicio_prevista || act.fechaInicioPrevista || 'S/F'} a {act.fecha_fin_prevista || act.fechaFinPrevista || '...'}</span>
                    </div>
                    <div className="text-[11px] text-text-dim">
                      <strong>Entregable:</strong> {act.entregable || <span className="italic text-text-dim/60">Sin entregable especificado</span>}
                    </div>
                  </div>

                  {canEdit && !isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(act)}
                      disabled={actionLoading}
                      className="btn-vercel-secondary text-xs py-1 px-3 self-start md:self-auto flex items-center gap-1"
                    >
                      <span>Actualizar Avance</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                {/* Modo Edición en Vivo */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-border-thin bg-surface-hover/20 p-3 rounded-lg space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                        Porcentaje de Avance Real: <span className="text-text-main font-mono text-sm">{editingProgreso}%</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickPercent(0)}
                          className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border-thin hover:bg-surface-hover text-text-dim"
                        >
                          0%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPercent(25)}
                          className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border-thin hover:bg-surface-hover text-text-dim"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPercent(50)}
                          className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border-thin hover:bg-surface-hover text-text-dim"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPercent(75)}
                          className="px-2 py-0.5 rounded text-[10px] bg-surface border border-border-thin hover:bg-surface-hover text-text-dim"
                        >
                          75%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickPercent(100)}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-bold hover:bg-emerald-500/20"
                        >
                          100% Completada
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={editingProgreso}
                      onChange={(e) => setEditingProgreso(Number(e.target.value))}
                      className="w-full accent-brand cursor-pointer"
                    />

                    <div>
                      <label className="block text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                        Evidencia o Entregable Obtenido
                      </label>
                      <input
                        type="text"
                        value={editingEntregable}
                        onChange={(e) => setEditingEntregable(e.target.value)}
                        placeholder="Ej: Documento de especificación técnica V1.0 / Enlace al repositorio"
                        className="w-full bg-surface border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveEditingId(null)}
                        className="btn-vercel-secondary text-xs py-1 px-3"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(idAct)}
                        disabled={actionLoading}
                        className="btn-vercel-primary text-xs py-1 px-3 flex items-center gap-1.5"
                      >
                        <Save size={13} />
                        <span>Guardar Avance</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
