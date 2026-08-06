import React from 'react';
import {
    Activity,
    TrendingUp,
    Trash2,
    Plus,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Shield,
    Clock
} from 'lucide-react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';

interface ProgressReportSectionProps {
    formData: any;
    cowork: any;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' }) => void;
    onAdd: (list: string, template: any) => void;
    onRemove: (list: string, index: number) => void;
    onUpdateItem: (list: string, index: number, field: string, value: any) => void;
    config?: any;
}

export const ProgressReportSection: React.FC<ProgressReportSectionProps> = ({
    formData,
    cowork,
    onUpdate,
    onAdd,
    onRemove,
    onUpdateItem,
    config
}) => {
    const isReadOnly = cowork?.session?.readOnly;

    // Configuración dinámica enviada desde la maquetación (Plantilla Admin)
    const sectionType = config?.sectionType;
    const variant = config?.activityVariant;
    const customTitle = config?.activityTableTitle;

    // Control de visibilidad aislado por bloque
    const isHeaderSection = sectionType === 'progress_header_section';
    const isStatusSection = sectionType === 'progress_status_section';
    const isActivitySection = sectionType === 'progress_activity_section' || !!variant;
    const isLegacyFull = !sectionType && !variant;

    const showHeader = isHeaderSection || isLegacyFull;
    const showActivities = isActivitySection || isLegacyFull;
    const showStatus = isStatusSection || isLegacyFull;

    const showEjecutadas = showActivities && (!variant || variant === 'ejecutadas');
    const showNoPrevistas = showActivities && (!variant || variant === 'no_previstas');
    const showObstaculos = showActivities && (!variant || variant === 'obstaculos');

    // Listas colaborativas
    const actividadesEjecutadas = formData.ActividadesEjecutadas || [];
    const actividadesNoPrevistas = formData.ActividadesNoPrevistas || [];
    const obstaculos = formData.Obstaculos || [];

    // Handlers para agregar filas
    const handleAddActividadEjecutada = () => {
        onAdd('ActividadesEjecutadas', {
            NumeroActividad: `Actividad ${actividadesEjecutadas.length + 1}`,
            ActividadesEjecutadas: '',
            ResultadosObtenidos: '',
            PorcentajeAvance: 100,
            Participantes: 'Director + Co-investigadores',
            FechaInicio: '',
            FechaFin: '',
            Observaciones: ''
        });
    };

    const handleAddActividadNoPrevista = () => {
        onAdd('ActividadesNoPrevistas', {
            NumeroActividad: `Actividad ${actividadesNoPrevistas.length + 1} NP`,
            ObjetivoAsociado: '',
            ActividadesEjecutadas: '',
            ResultadosObtenidos: '',
            PorcentajeAvance: 100,
            Participantes: 'Director + Co-investigadores',
            FechaInicio: '',
            FechaFin: '',
            Observaciones: ''
        });
    };

    const handleAddObstaculo = () => {
        onAdd('Obstaculos', {
            NumeroActividad: `Actividad ${obstaculos.length + 1} OBS`,
            ObjetivoAsociado: '',
            Limitacion: '',
            ActividadesEjecutadas: '',
            ResultadosObtenidos: '',
            PorcentajeAvance: 100,
            Participantes: 'Director + Co-investigadores',
            FechaInicio: '',
            FechaFin: '',
            Observaciones: ''
        });
    };

    const statusOptions = ['INICIADO', 'EN AVANCE', 'SUSPENDIDO', 'POR FINALIZAR', 'FINALIZADO'];

    return (
        <div className="space-y-10 animate-fade-in pb-10 text-white">

            {/* 0. SECCIÓN: DATOS GENERALES DEL PROYECTO (ENCABEZADO INFORME AVANCE) */}
            {showHeader && (
                <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                                <FileText size={18} />
                                1. DATOS GENERALES DEL PROYECTO (AUTO-POBLADOS)
                            </h3>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold mt-0.5">
                                Identificación Institucional ISTPET — Datos heredados de la propuesta aprobada
                            </p>
                        </div>
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full uppercase border border-amber-500/30">
                            Oficial ISTPET
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Número de Informe</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.NumeroInforme || formData.IdInforme || 'N° 01'}
                                onChange={(e) => onUpdate('NumeroInforme', e.target.value)}
                                placeholder="Ej: Informe N° 01"
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Nombre del Proyecto</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.NombreProyecto ?? formData.nombre_proyecto ?? formData.Titulo ?? formData.titulo ?? formData.title ?? config?.schema?.NombreProyecto ?? ''}
                                onChange={(e) => onUpdate('NombreProyecto', e.target.value)}
                                placeholder="Escribir o corregir nombre del proyecto..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Programa</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.Programa ?? formData.programa ?? config?.schema?.Programa ?? ''}
                                onChange={(e) => onUpdate('Programa', e.target.value)}
                                placeholder="Escribir o corregir programa..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Grupo de Investigación</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.GrupoInvestigacion ?? formData.grupo_investigacion ?? formData.GrupoInvestigacionNombre ?? config?.schema?.GrupoInvestigacion ?? ''}
                                onChange={(e) => onUpdate('GrupoInvestigacion', e.target.value)}
                                placeholder="Escribir o corregir grupo de investigación..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Dominio</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.Dominio ?? formData.dominio ?? config?.schema?.Dominio ?? ''}
                                onChange={(e) => onUpdate('Dominio', e.target.value)}
                                placeholder="Escribir o corregir dominio de investigación..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Línea de Investigación</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.LineaInvestigacion ?? formData.linea_investigacion ?? config?.schema?.LineaInvestigacion ?? ''}
                                onChange={(e) => onUpdate('LineaInvestigacion', e.target.value)}
                                placeholder="Escribir o corregir línea de investigación..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Sublínea de Investigación</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.SublineaInvestigacion ?? formData.sublinea_investigacion ?? config?.schema?.SublineaInvestigacion ?? ''}
                                onChange={(e) => onUpdate('SublineaInvestigacion', e.target.value)}
                                placeholder="Escribir o corregir sublínea..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Campo Amplio</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.CampoAmplio ?? formData.campo_amplio ?? config?.schema?.CampoAmplio ?? ''}
                                onChange={(e) => onUpdate('CampoAmplio', e.target.value)}
                                placeholder="Escribir o corregir campo amplio UNESCO..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Campo Específico</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.CampoEspecifico ?? formData.campo_especifico ?? config?.schema?.CampoEspecifico ?? ''}
                                onChange={(e) => onUpdate('CampoEspecifico', e.target.value)}
                                placeholder="Escribir o corregir campo específico..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Campo Detallado</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.CampoDetallado ?? formData.campo_detallado ?? config?.schema?.CampoDetallado ?? ''}
                                onChange={(e) => onUpdate('CampoDetallado', e.target.value)}
                                placeholder="Escribir o corregir campo detallado..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Carrera</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.Carrera ?? formData.carrera ?? config?.schema?.Carrera ?? ''}
                                onChange={(e) => onUpdate('Carrera', e.target.value)}
                                placeholder="Escribir o corregir carrera..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Tipo de Investigación</label>
                            <div className="flex items-center gap-3 pt-1">
                                {['BÁSICA', 'APLICADA', 'DESARROLLO EXPERIMENTAL'].map((tipo) => {
                                    const currentTipo = (formData.TipoInvestigacion || formData.tipo_investigacion || config?.schema?.TipoInvestigacion || 'APLICADA').toString().toUpperCase();
                                    const isChecked = currentTipo.includes(tipo.substring(0, 5));
                                    return (
                                        <label key={tipo} className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
                                            <input
                                                type="radio"
                                                name="tipo_inv"
                                                checked={isChecked}
                                                onChange={() => onUpdate('TipoInvestigacion', tipo)}
                                                disabled={isReadOnly}
                                                className="accent-amber-500"
                                            />
                                            <span className={isChecked ? 'font-bold text-text-main' : ''}>{tipo}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Período Académico</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.Periodo ?? formData.periodo ?? formData.PeriodoConvocatoria ?? config?.schema?.Periodo ?? ''}
                                onChange={(e) => onUpdate('Periodo', e.target.value)}
                                placeholder="Escribir o corregir período académico..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Director del Proyecto</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.DirectorProyecto ?? formData.director_proyecto ?? formData.NombreDirectorFirma ?? config?.schema?.DirectorProyecto ?? ''}
                                onChange={(e) => onUpdate('DirectorProyecto', e.target.value)}
                                placeholder="Escribir o corregir director del proyecto..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Investigadores Activos en el Período</label>
                            <textarea
                                disabled={isReadOnly}
                                rows={2}
                                value={formData.InvestigadoresTexto ?? formData.investigadores_texto ?? (Array.isArray(formData.Investigadores) && formData.Investigadores.length > 0
                                    ? formData.Investigadores.map((i: any) => i?.Nombre || `${i?.Nombres || ''} ${i?.Apellidos || ''}`.trim()).filter(Boolean).join(', ')
                                    : (config?.schema?.InvestigadoresTexto ?? ''))}
                                onChange={(e) => onUpdate('InvestigadoresTexto', e.target.value)}
                                placeholder="Apellidos y nombres de los investigadores activos..."
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500 custom-scrollbar resize-none"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Fecha Inicio del Proyecto</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.FechaInicio ?? formData.fecha_inicio ?? config?.schema?.FechaInicio ?? ''}
                                onChange={(e) => onUpdate('FechaInicio', e.target.value)}
                                placeholder="Ej: 01/01/2026"
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        <div className="p-4 border border-border-thin rounded-2xl bg-surface-hover/10 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-text-dim block">Fecha Fin Prevista del Proyecto</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={formData.FechaFin ?? formData.fecha_fin ?? config?.schema?.FechaFin ?? ''}
                                onChange={(e) => onUpdate('FechaFin', e.target.value)}
                                placeholder="Ej: 31/12/2026"
                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 1. SECCIÓN: MATRIZ DE ACTIVIDADES EJECUTADAS */}
            {showEjecutadas && (
                <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center border-b border-border-thin pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-main">
                                    {customTitle || '2. Matriz de Actividades Ejecutadas'}
                                </h4>
                                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Actividades realizadas en el período reportado</p>
                            </div>
                        </div>
                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={handleAddActividadEjecutada}
                                className="btn-vercel-secondary text-xs flex items-center gap-2"
                            >
                                <Plus size={14} />
                                <span>Agregar Actividad</span>
                            </button>
                        )}
                    </div>

                    {actividadesEjecutadas.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-border-thin rounded-2xl bg-surface-hover/10">
                            <Activity className="w-8 h-8 text-text-dim mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold text-text-dim">No hay actividades ejecutadas registradas.</p>
                            <p className="text-[10px] text-text-dim/70 mt-1">Presiona "Agregar Actividad" para comenzar el llenado.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {actividadesEjecutadas.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border border-border-thin rounded-2xl bg-bg-deep space-y-4 relative group">
                                    <div className="flex items-center justify-between border-b border-border-thin/50 pb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                                                {item.NumeroActividad || `Actividad ${idx + 1}`}
                                            </span>
                                        </div>
                                        {!isReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() => onRemove('ActividadesEjecutadas', idx)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                title="Eliminar actividad"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim">Actividades Ejecutadas (Detalle)</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ActividadesEjecutadas || ''}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'ActividadesEjecutadas', e.target.value)}
                                                placeholder="Detallar la actividad ejecutada..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[70px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim">Resultados Obtenidos & Evidencias</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ResultadosObtenidos || ''}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'ResultadosObtenidos', e.target.value)}
                                                placeholder="Resultados alcanzados e inclusión en Anexos..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[70px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border-thin/30">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">% Avance</label>
                                            <input
                                                type="number"
                                                min={0} max={100}
                                                disabled={isReadOnly}
                                                value={item.PorcentajeAvance ?? 100}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'PorcentajeAvance', Number(e.target.value))}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs font-bold text-emerald-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Participantes</label>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={item.Participantes || ''}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'Participantes', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Inicio</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaInicio || ''}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'FechaInicio', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Fin</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaFin || ''}
                                                onChange={(e) => onUpdateItem('ActividadesEjecutadas', idx, 'FechaFin', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. SECCIÓN: ACTIVIDADES NO PREVISTAS (NP) */}
            {showNoPrevistas && (
                <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center border-b border-border-thin pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-main">
                                    {customTitle || '3. Actividades No Previstas (NP)'}
                                </h4>
                                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Actividades fuera de planificación original</p>
                            </div>
                        </div>
                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={handleAddActividadNoPrevista}
                                className="btn-vercel-secondary text-xs flex items-center gap-2"
                            >
                                <Plus size={14} />
                                <span>Agregar Actividad NP</span>
                            </button>
                        )}
                    </div>

                    {actividadesNoPrevistas.length === 0 ? (
                        <p className="text-xs text-text-dim italic text-center p-4">No hay actividades no previstas reportadas.</p>
                    ) : (
                        <div className="space-y-4">
                            {actividadesNoPrevistas.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border border-amber-500/20 rounded-2xl bg-amber-500/5 space-y-4 relative group">
                                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                                        <span className="text-xs font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                            {item.NumeroActividad || `Actividad ${idx + 1}NP`}
                                        </span>
                                        {!isReadOnly && (
                                            <button type="button" onClick={() => onRemove('ActividadesNoPrevistas', idx)} className="text-red-400 p-1 hover:bg-red-500/10 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Objetivo del Proyecto de Investigación</label>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={item.ObjetivoAsociado || ''}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'ObjetivoAsociado', e.target.value)}
                                                placeholder="Objetivo específico al que se asocia..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Actividad No Prevista Ejecutada</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ActividadesEjecutadas || ''}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'ActividadesEjecutadas', e.target.value)}
                                                placeholder="Describir la actividad NO prevista..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Resultados Obtenidos</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ResultadosObtenidos || ''}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'ResultadosObtenidos', e.target.value)}
                                                placeholder="Describir resultados alcanzados de forma concreta..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-amber-500/20">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">% Avance</label>
                                            <input
                                                type="number"
                                                min={0} max={100}
                                                disabled={isReadOnly}
                                                value={item.PorcentajeAvance ?? 100}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'PorcentajeAvance', Number(e.target.value))}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs font-bold text-amber-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Participantes</label>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={item.Participantes || 'Director del Proyecto, Investigadores'}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'Participantes', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Inicio NP</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaInicio || ''}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'FechaInicio', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Fin NP</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaFin || ''}
                                                onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'FechaFin', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-amber-500/20 space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-amber-400">Observaciones (Particularidades / Respaldo Anexos NP)</label>
                                        <textarea
                                            disabled={isReadOnly}
                                            value={item.Observaciones || ''}
                                            onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'Observaciones', e.target.value)}
                                            placeholder="Particularidades o anexo correspondiente (ej: Anexo 1NP)..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. SECCIÓN: OBSTÁCULOS Y ACTIVIDADES CORRECTIVAS (OBS) */}
            {showObstaculos && (
                <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center border-b border-border-thin pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-main">
                                    {customTitle || '4. Obstáculos y Acciones Correctivas (OBS)'}
                                </h4>
                                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Limitaciones encontradas y su resolución</p>
                            </div>
                        </div>
                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={handleAddObstaculo}
                                className="btn-vercel-secondary text-xs flex items-center gap-2"
                            >
                                <Plus size={14} />
                                <span>Agregar Obstáculo</span>
                            </button>
                        )}
                    </div>

                    {obstaculos.length === 0 ? (
                        <p className="text-xs text-text-dim italic text-center p-4">No se han registrado obstáculos o limitaciones.</p>
                    ) : (
                        <div className="space-y-4">
                            {obstaculos.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 space-y-4 relative group">
                                    <div className="flex justify-between items-center border-b border-red-500/20 pb-2">
                                        <span className="text-xs font-black uppercase text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg">
                                            {item.NumeroActividad || `Actividad ${idx + 1} OBS`}
                                        </span>
                                        {!isReadOnly && (
                                            <button type="button" onClick={() => onRemove('Obstaculos', idx)} className="text-red-400 p-1 hover:bg-red-500/10 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Objetivo del Proyecto de Investigación</label>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={item.ObjetivoAsociado || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'ObjetivoAsociado', e.target.value)}
                                                placeholder="Objetivo específico al que se asocia..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-red-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Limitación / Obstáculo Presentado</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.Limitacion || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'Limitacion', e.target.value)}
                                                placeholder="Describir la limitación o problema..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Actividad Correctiva Desarrollada</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ActividadesEjecutadas || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'ActividadesEjecutadas', e.target.value)}
                                                placeholder="Describir actividades correctivas desarrolladas..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-text-dim block">Resultados Obtenidos</label>
                                            <textarea
                                                disabled={isReadOnly}
                                                value={item.ResultadosObtenidos || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'ResultadosObtenidos', e.target.value)}
                                                placeholder="Resultados tras aplicar la medida correctiva..."
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[60px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-red-500/20">
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">% Avance</label>
                                            <input
                                                type="number"
                                                min={0} max={100}
                                                disabled={isReadOnly}
                                                value={item.PorcentajeAvance ?? 100}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'PorcentajeAvance', Number(e.target.value))}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs font-bold text-red-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Participantes</label>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={item.Participantes || 'Director del Proyecto, Investigadores'}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'Participantes', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Inicio Correctiva</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaInicio || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'FechaInicio', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Fecha Fin Correctiva</label>
                                            <input
                                                type="date"
                                                disabled={isReadOnly}
                                                value={item.FechaFin || ''}
                                                onChange={(e) => onUpdateItem('Obstaculos', idx, 'FechaFin', e.target.value)}
                                                className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-red-500/20 space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-red-400">Observaciones (Particularidades / Respaldo Anexos OBS)</label>
                                        <textarea
                                            disabled={isReadOnly}
                                            value={item.Observaciones || ''}
                                            onChange={(e) => onUpdateItem('Obstaculos', idx, 'Observaciones', e.target.value)}
                                            placeholder="Particularidades o anexo correspondiente (ej: Anexo 1 OBS)..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-xl p-2.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[60px]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. SECCIÓN: ESTADO DE EJECUCIÓN Y OBSERVACIONES DEL PROYECTO */}
            {showStatus && (
                <>
                    <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-border-thin pb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-text-main">5. Estado de Ejecución del Proyecto</h4>
                                <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Dictamen del estado del proyecto e informe de fase</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold uppercase text-text-dim block mb-2">Estado Actual Seleccionado</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => onUpdate('EstadoEjecucion', opt)}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${(formData.EstadoEjecucion || 'EN AVANCE') === opt
                                                    ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500'
                                                    : 'border-border-thin bg-surface-hover/20 text-text-dim hover:text-text-main'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[9px] font-bold uppercase text-text-dim block">
                                    Descripción Breve de la Fase Actual (3 a 6 líneas)
                                </label>
                                <div className="border border-border-thin rounded-2xl overflow-hidden bg-bg-deep">
                                    <CoWorkEditor
                                        field="DescripcionFaseActual"
                                        cowork={cowork}
                                        onChange={(html, meta) => onUpdate('DescripcionFaseActual', html, meta)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. SECCIÓN: OBSERVACIONES DEL DIRECTOR Y DEL COORDINADOR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Observaciones del Director */}
                        <div className="bg-bg-deep border border-border-thin p-6 rounded-3xl space-y-4">
                            <div className="flex items-center gap-2 border-b border-border-thin pb-3">
                                <Shield className="w-4 h-4 text-amber-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">Observaciones del Director de Proyecto</h4>
                            </div>
                            <div className="border border-border-thin rounded-2xl overflow-hidden bg-bg-deep min-h-[100px]">
                                <CoWorkEditor
                                    field="ObservacionesDirector"
                                    cowork={cowork}
                                    onChange={(html, meta) => onUpdate('ObservacionesDirector', html, meta)}
                                />
                            </div>
                        </div>

                        {/* Observaciones del Coordinador DIITRA */}
                        <div className="bg-bg-deep border border-border-thin p-6 rounded-3xl space-y-4">
                            <div className="flex items-center gap-2 border-b border-border-thin pb-3">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">Observaciones del Coordinador DIITRA</h4>
                            </div>
                            <div className="border border-border-thin rounded-2xl overflow-hidden bg-bg-deep min-h-[100px]">
                                <CoWorkEditor
                                    field="ObservacionesCoordinador"
                                    cowork={cowork}
                                    onChange={(html, meta) => onUpdate('ObservacionesCoordinador', html, meta)}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};
