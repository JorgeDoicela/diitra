import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  FileText, 
  RefreshCw, 
  Users, 
  Check, 
  TrendingUp 
} from 'lucide-react';
import { useProjectSchedule } from './hooks/useProjectSchedule';
import { ScheduleGanttTab } from './components/ScheduleGanttTab';
import { ScheduleTrackerTab } from './components/ScheduleTrackerTab';
import { ScheduleReportModal } from './components/ScheduleReportModal';

export interface ProjectScheduleModuleProps {
  projectUuid: string;
  projectTitle?: string;
  modalidad?: string;
  modalidadEquipo?: string;
  grupoInvestigacion?: string;
}

export const ProjectScheduleModule: React.FC<ProjectScheduleModuleProps> = ({
  projectUuid,
  projectTitle = 'Proyecto de Investigación',
  modalidad = 'Investigación',
  modalidadEquipo = 'INDIVIDUAL',
  grupoInvestigacion
}) => {
  const {
    cronograma,
    loading,
    actionLoading,
    error,
    fetchCronograma,
    handleActualizarProgreso,
    handleGuardarActividad,
    handleEliminarActividad
  } = useProjectSchedule(projectUuid);

  const [activeTab, setActiveTab] = useState<'gantt' | 'tracker'>('gantt');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (loading && !cronograma) {
    return (
      <div className="bento-card p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-surface-hover/60 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface-hover/40 rounded-xl"></div>
          ))}
        </div>
        <div className="h-48 bg-surface-hover/20 rounded-xl"></div>
      </div>
    );
  }

  if (error && !cronograma) {
    return (
      <div className="bento-card p-6 text-center space-y-3">
        <p className="text-red-500 text-xs font-semibold">{error}</p>
        <button
          type="button"
          onClick={fetchCronograma}
          className="btn-vercel-secondary text-xs px-3 py-1 inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  const resumen = cronograma || {
    total_actividades: 0,
    actividades_completadas: 0,
    actividades_en_curso: 0,
    actividades_atrasadas: 0,
    porcentaje_avance_global: 0,
    semaforo_plazos: 'VERDE' as const,
    hitos_caces_totales: 0,
    hitos_caces_cumplidos: 0,
    puede_editar: false,
    estado_proyecto: '',
    actividades: []
  };

  const totalActividades = resumen.total_actividades ?? resumen.totalActividades ?? 0;
  const completadas = resumen.actividades_completadas ?? resumen.actividadesCompletadas ?? 0;
  const enCurso = resumen.actividades_en_curso ?? resumen.actividadesEnCurso ?? 0;
  const atrasadas = resumen.actividades_atrasadas ?? resumen.actividadesAtrasadas ?? 0;
  const pctGlobal = resumen.porcentaje_avance_global ?? resumen.porcentajeAvanceGlobal ?? 0;
  const hitosCacesTotales = resumen.hitos_caces_totales ?? resumen.hitosCacesTotales ?? 0;
  const hitosCacesCumplidos = resumen.hitos_caces_cumplidos ?? resumen.hitosCacesCumplidos ?? 0;
  const puedeEditar = resumen.puede_editar ?? resumen.puedeEditar ?? true;

  const semaforoColor = {
    VERDE: 'text-emerald-500',
    AMARILLO: 'text-amber-500',
    ROJO: 'text-red-500'
  }[resumen.semaforo_plazos || resumen.semaforoPlazos || 'VERDE'];

  return (
    <div className="bento-card p-6 md:p-8 space-y-6 font-sans">
      {/* 1. Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-thin pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="text-text-main" size={20} />
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider">
              Cronograma y Seguimiento de Actividades
            </h3>
            <span className="badge-vercel text-[10px] font-bold text-text-dim">
              Sección 7 Oficial
            </span>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Planificación de semanas de trabajo, hitos CACES y monitoreo de cumplimiento de metas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modalidad && (
            <span className="badge-vercel text-[10px] font-medium text-text-dim">
              {modalidad.toLowerCase().includes('innov') ? 'Innovación' : 'Investigación'}
            </span>
          )}
          <span className="badge-vercel text-[10px] font-medium text-text-dim flex items-center gap-1">
            <Users size={11} />
            {modalidadEquipo === 'GRUPO' ? (grupoInvestigacion || 'Grupo') : 'Individual'}
          </span>
        </div>
      </div>

      {/* 2. Barra de Métricas de Alta Densidad (Bento Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* AVANCE GLOBAL */}
        <div className="p-3.5 rounded-xl border border-border-thin bg-surface/50 space-y-1">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Avance Global
          </span>
          <div className="flex items-center justify-between">
            <span className={`text-base font-mono font-bold ${semaforoColor}`}>
              {pctGlobal.toFixed(1)}%
            </span>
            <TrendingUp size={15} className={semaforoColor} />
          </div>
          <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, pctGlobal))}%` }} 
            />
          </div>
        </div>

        {/* ACTIVIDADES COMPLETADAS */}
        <div className="p-3.5 rounded-xl border border-border-thin bg-surface/50 space-y-1">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Completadas
          </span>
          <div className="flex items-center justify-between">
            <span className="text-base font-mono font-bold text-text-main">
              {completadas} <span className="text-xs font-normal text-text-dim">/ {totalActividades}</span>
            </span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <span className="text-[10px] text-text-dim block">
            {totalActividades > 0 ? `${Math.round((completadas / totalActividades) * 100)}% de tareas` : 'Sin tareas'}
          </span>
        </div>

        {/* EN CURSO */}
        <div className="p-3.5 rounded-xl border border-border-thin bg-surface/50 space-y-1">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            En Curso
          </span>
          <div className="flex items-center justify-between">
            <span className="text-base font-mono font-bold text-blue-500">
              {enCurso}
            </span>
            <Clock size={15} className="text-blue-500" />
          </div>
          <span className="text-[10px] text-text-dim block">Actividades activas</span>
        </div>

        {/* CON RETRASO */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${
          atrasadas > 0 
            ? 'border-red-500/40 bg-red-500/5' 
            : 'border-border-thin bg-surface/50'
        }`}>
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Con Retraso
          </span>
          <div className="flex items-center justify-between">
            <span className={`text-base font-mono font-bold ${atrasadas > 0 ? 'text-red-500' : 'text-text-main'}`}>
              {atrasadas}
            </span>
            <AlertTriangle size={15} className={atrasadas > 0 ? 'text-red-500' : 'text-text-dim'} />
          </div>
          <span className="text-[10px] text-text-dim block">
            {atrasadas > 0 ? 'Plazo vencido' : 'Al día'}
          </span>
        </div>

        {/* HITOS CACES */}
        <div className="p-3.5 rounded-xl border border-border-thin bg-surface/50 space-y-1">
          <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
            Hitos CACES
          </span>
          <div className="flex items-center justify-between">
            <span className="text-base font-mono font-bold text-amber-500">
              {hitosCacesCumplidos} <span className="text-xs font-normal text-text-dim">/ {hitosCacesTotales}</span>
            </span>
            <Award size={15} className="text-amber-500" />
          </div>
          <span className="text-[10px] text-text-dim block">Entregables clave</span>
        </div>
      </div>

      {/* 3. Selector de Pestañas y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('gantt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gantt'
                ? 'bg-surface-hover text-text-main shadow-xs border border-border-thin'
                : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Calendar size={13} />
            <span>Diagrama de Gantt (§7)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tracker'
                ? 'bg-surface-hover text-text-main shadow-xs border border-border-thin'
                : 'text-text-dim hover:text-text-main'
            }`}
          >
            <Clock size={13} />
            <span>Control de Avance ({totalActividades})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="btn-vercel-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileText size={13} />
          <span>Copiar Cronograma para Informes</span>
        </button>
      </div>

      {/* 4. Contenido de las Pestañas */}
      {activeTab === 'gantt' ? (
        <ScheduleGanttTab
          actividades={resumen.actividades || []}
          canEdit={puedeEditar}
          onSaveActividad={handleGuardarActividad}
          onDeleteActividad={handleEliminarActividad}
          actionLoading={actionLoading}
        />
      ) : (
        <ScheduleTrackerTab
          actividades={resumen.actividades || []}
          canEdit={puedeEditar}
          onUpdateProgreso={handleActualizarProgreso}
          actionLoading={actionLoading}
        />
      )}

      {/* 5. Modal de Exportación */}
      <ScheduleReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resumen={resumen}
        projectTitle={projectTitle}
      />
    </div>
  );
};

export default ProjectScheduleModule;
