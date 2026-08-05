import React from 'react';
import { 
    Activity, 
    Upload, 
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

            {/* 1. SECCIÓN: MATRIZ DE ACTIVIDADES EJECUTADAS */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">2. Matriz de Actividades Ejecutadas</h4>
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

            {/* 2. SECCIÓN: ACTIVIDADES NO PREVISTAS (NP) */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">3. Actividades No Previstas (NP)</h4>
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
                            <div key={idx} className="p-4 border border-amber-500/20 rounded-2xl bg-amber-500/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                        {item.NumeroActividad || `Actividad ${idx + 1} NP`}
                                    </span>
                                    {!isReadOnly && (
                                        <button type="button" onClick={() => onRemove('ActividadesNoPrevistas', idx)} className="text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Objetivo Específico Asociado</label>
                                        <input
                                            type="text"
                                            disabled={isReadOnly}
                                            value={item.ObjetivoAsociado || ''}
                                            onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'ObjetivoAsociado', e.target.value)}
                                            placeholder="Objetivo del proyecto al que se asocia..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Actividad No Prevista Ejecutada</label>
                                        <input
                                            type="text"
                                            disabled={isReadOnly}
                                            value={item.ActividadesEjecutadas || ''}
                                            onChange={(e) => onUpdateItem('ActividadesNoPrevistas', idx, 'ActividadesEjecutadas', e.target.value)}
                                            placeholder="Descripción de la actividad realizada..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. SECCIÓN: OBSTÁCULOS Y ACTIVIDADES CORRECTIVAS (OBS) */}
            <div className="bg-bg-deep border border-border-thin p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-border-thin pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-text-main">4. Obstáculos y Acciones Correctivas (OBS)</h4>
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
                            <div key={idx} className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                        {item.NumeroActividad || `Actividad ${idx + 1} OBS`}
                                    </span>
                                    {!isReadOnly && (
                                        <button type="button" onClick={() => onRemove('Obstaculos', idx)} className="text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Limitación u Obstáculo Encontrado</label>
                                        <textarea
                                            disabled={isReadOnly}
                                            value={item.Limitacion || ''}
                                            onChange={(e) => onUpdateItem('Obstaculos', idx, 'Limitacion', e.target.value)}
                                            placeholder="Describir el problema o imprevisto..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main min-h-[60px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-text-dim block mb-1">Actividad Correctiva Realizada</label>
                                        <textarea
                                            disabled={isReadOnly}
                                            value={item.ActividadesEjecutadas || ''}
                                            onChange={(e) => onUpdateItem('Obstaculos', idx, 'ActividadesEjecutadas', e.target.value)}
                                            placeholder="Describir cómo se resolvió el obstáculo..."
                                            className="w-full bg-surface-hover/30 border border-border-thin rounded-lg p-2 text-xs text-text-main min-h-[60px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. SECCIÓN: ESTADO DE EJECUCIÓN DEL PROYECTO */}
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
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                                        (formData.EstadoEjecucion || 'EN AVANCE') === opt
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

        </div>
    );
};
