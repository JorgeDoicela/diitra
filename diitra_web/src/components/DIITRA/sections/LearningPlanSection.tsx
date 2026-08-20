import React, { useState, useMemo, useContext } from 'react';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';
import { exportLearningPlanToExcel } from '../../../utils/learningPlanExcelExport';

interface PrerrequisitoItem {
    id: string;
    descripcion: string;
    nivel: 1 | 2 | 3 | 4 | null;
}

interface ActividadPlanItem {
    id: string;
    objetivoProyecto: string;
    asignatura: string;
    resultadoAprendizaje: string;
    actividad: string;
    fecha: string;
    nivel: 1 | 2 | 3 | 4 | null;
    observaciones: string;
}

interface EstudianteEvaluacion {
    id: string;
    nombreEstudiante: string;
    cedula?: string;
    prerrequisitosCognitivos: PrerrequisitoItem[];
    prerrequisitosProcedimentales: PrerrequisitoItem[];
    actividadesPlan: ActividadPlanItem[];
}

interface LearningPlanSectionProps {
    formData?: any;
    cowork: CoWorkHandle;
    onUpdate?: (field: string, value: any) => void;
    isAdmin?: boolean;
    readOnly?: boolean;
    templateCode?: string;
}

const DEFAULT_COGNITIVOS: PrerrequisitoItem[] = [
    { id: 'cog_1', descripcion: 'Conocimientos fundamentales en la línea de investigación', nivel: 3 },
    { id: 'cog_2', descripcion: 'Dominio de metodologías de recolección y análisis de datos', nivel: 3 },
    { id: 'cog_3', descripcion: 'Comprensión de los fundamentos teóricos del proyecto', nivel: 3 }
];

const DEFAULT_PROCEDIMENTALES: PrerrequisitoItem[] = [
    { id: 'proc_1', descripcion: 'Manejo de herramientas de software / instrumentación de laboratorio', nivel: 3 },
    { id: 'proc_2', descripcion: 'Capacidad de síntesis y redacción de reportes técnicos', nivel: 3 },
    { id: 'proc_3', descripcion: 'Puntualidad y cumplimiento de entregables programados', nivel: 3 }
];

const DEFAULT_ACTIVIDAD: ActividadPlanItem = {
    id: 'act_1',
    objetivoProyecto: '',
    asignatura: '',
    resultadoAprendizaje: '',
    actividad: '',
    fecha: '',
    nivel: 3,
    observaciones: ''
};

export const LearningPlanSection: React.FC<LearningPlanSectionProps> = ({
    formData = {},
    cowork,
    onUpdate,
    isAdmin = false,
    readOnly = false,
    templateCode
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly || cowork.session.readOnly;
    const isEvaluationMode = templateCode === 'EVALUACION_PLAN_APRENDIZAJE' || formData?.isEvaluationMode === true;
    const estadoAprobacion = formData.EstadoAprobacion || 'Pendiente';

    // Lista de fichas de estudiantes
    const estudiantesList: EstudianteEvaluacion[] = useMemo(() => {
        const raw = formData.EstudiantesEvaluaciones;
        if (Array.isArray(raw) && raw.length > 0) return raw;
        return [
            {
                id: 'est_default_1',
                nombreEstudiante: formData.NombreEstudiante || 'Estudiante 1',
                cedula: '',
                prerrequisitosCognitivos: [...DEFAULT_COGNITIVOS],
                prerrequisitosProcedimentales: [...DEFAULT_PROCEDIMENTALES],
                actividadesPlan: [{ ...DEFAULT_ACTIVIDAD }]
            }
        ];
    }, [formData.EstudiantesEvaluaciones, formData.NombreEstudiante]);

    const [activeEstudianteIndex, setActiveEstudianteIndex] = useState(0);

    const activeEstudiante: EstudianteEvaluacion = useMemo(() => {
        return estudiantesList[activeEstudianteIndex] || estudiantesList[0] || {
            id: 'est_default_1',
            nombreEstudiante: 'Estudiante 1',
            prerrequisitosCognitivos: [],
            prerrequisitosProcedimentales: [],
            actividadesPlan: []
        };
    }, [estudiantesList, activeEstudianteIndex]);

    // Actualizador de fichas de estudiantes en Yjs / Form Data
    const updateEstudiantesList = (newList: EstudianteEvaluacion[]) => {
        if (effectiveReadOnly) return;
        if (onUpdate) {
            onUpdate('EstudiantesEvaluaciones', newList);
        }
    };

    // Agregar nuevo estudiante (solo en modo formulación)
    const handleAddEstudiante = () => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const newEst: EstudianteEvaluacion = {
            id: `est_${Date.now()}`,
            nombreEstudiante: `Estudiante ${estudiantesList.length + 1}`,
            cedula: '',
            prerrequisitosCognitivos: [...DEFAULT_COGNITIVOS],
            prerrequisitosProcedimentales: [...DEFAULT_PROCEDIMENTALES],
            actividadesPlan: [{ ...DEFAULT_ACTIVIDAD }]
        };
        const updated = [...estudiantesList, newEst];
        updateEstudiantesList(updated);
        setActiveEstudianteIndex(updated.length - 1);
    };

    // Eliminar estudiante
    const handleRemoveEstudiante = (index: number) => {
        if (effectiveReadOnly || isEvaluationMode || estudiantesList.length <= 1) return;
        const updated = estudiantesList.filter((_, i) => i !== index);
        updateEstudiantesList(updated);
        setActiveEstudianteIndex(Math.max(0, index - 1));
    };

    // Actualizar nombre del estudiante activo
    const handleUpdateNombreEstudiante = (nombre: string) => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            nombreEstudiante: nombre
        };
        updateEstudiantesList(updated);
    };

    // Prerrequisitos Cognitivos
    const handleUpdateCognitivo = (idx: number, field: 'descripcion' | 'nivel', val: any) => {
        if (effectiveReadOnly) return;
        const updated = [...estudiantesList];
        const currentCog = [...(updated[activeEstudianteIndex]?.prerrequisitosCognitivos || [])];
        currentCog[idx] = { ...currentCog[idx], [field]: val };
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosCognitivos: currentCog
        };
        updateEstudiantesList(updated);
    };

    const handleAddCognitivo = () => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentCog = [...(updated[activeEstudianteIndex]?.prerrequisitosCognitivos || [])];
        currentCog.push({ id: `cog_${Date.now()}`, descripcion: '', nivel: 3 });
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosCognitivos: currentCog
        };
        updateEstudiantesList(updated);
    };

    const handleRemoveCognitivo = (idx: number) => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentCog = (updated[activeEstudianteIndex]?.prerrequisitosCognitivos || []).filter((_, i) => i !== idx);
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosCognitivos: currentCog
        };
        updateEstudiantesList(updated);
    };

    // Prerrequisitos Procedimentales
    const handleUpdateProcedimental = (idx: number, field: 'descripcion' | 'nivel', val: any) => {
        if (effectiveReadOnly) return;
        const updated = [...estudiantesList];
        const currentProc = [...(updated[activeEstudianteIndex]?.prerrequisitosProcedimentales || [])];
        currentProc[idx] = { ...currentProc[idx], [field]: val };
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosProcedimentales: currentProc
        };
        updateEstudiantesList(updated);
    };

    const handleAddProcedimental = () => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentProc = [...(updated[activeEstudianteIndex]?.prerrequisitosProcedimentales || [])];
        currentProc.push({ id: `proc_${Date.now()}`, descripcion: '', nivel: 3 });
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosProcedimentales: currentProc
        };
        updateEstudiantesList(updated);
    };

    const handleRemoveProcedimental = (idx: number) => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentProc = (updated[activeEstudianteIndex]?.prerrequisitosProcedimentales || []).filter((_, i) => i !== idx);
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            prerrequisitosProcedimentales: currentProc
        };
        updateEstudiantesList(updated);
    };

    // Actividades del Plan
    const handleUpdateActividad = (idx: number, field: keyof ActividadPlanItem, val: any) => {
        if (effectiveReadOnly) return;
        const updated = [...estudiantesList];
        const currentActs = [...(updated[activeEstudianteIndex]?.actividadesPlan || [])];
        currentActs[idx] = { ...currentActs[idx], [field]: val };
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            actividadesPlan: currentActs
        };
        updateEstudiantesList(updated);
    };

    const handleAddActividad = () => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentActs = [...(updated[activeEstudianteIndex]?.actividadesPlan || [])];
        currentActs.push({
            id: `act_${Date.now()}`,
            objetivoProyecto: '',
            asignatura: '',
            resultadoAprendizaje: '',
            actividad: '',
            fecha: '',
            nivel: 3,
            observaciones: ''
        });
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            actividadesPlan: currentActs
        };
        updateEstudiantesList(updated);
    };

    const handleRemoveActividad = (idx: number) => {
        if (effectiveReadOnly || isEvaluationMode) return;
        const updated = [...estudiantesList];
        const currentActs = (updated[activeEstudianteIndex]?.actividadesPlan || []).filter((_, i) => i !== idx);
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            actividadesPlan: currentActs
        };
        updateEstudiantesList(updated);
    };

    // Cálculo de promedios
    const calculatePromedio = (items: { nivel: 1 | 2 | 3 | 4 | null }[]) => {
        const validos = items.filter((i) => typeof i.nivel === 'number' && i.nivel > 0);
        if (validos.length === 0) return '0.00';
        const sum = validos.reduce((acc, curr) => acc + (curr.nivel || 0), 0);
        return (sum / validos.length).toFixed(2);
    };

    const promedioCognitivos = useMemo(() => {
        return calculatePromedio(activeEstudiante.prerrequisitosCognitivos);
    }, [activeEstudiante.prerrequisitosCognitivos]);

    const promedioProcedimentales = useMemo(() => {
        return calculatePromedio(activeEstudiante.prerrequisitosProcedimentales);
    }, [activeEstudiante.prerrequisitosProcedimentales]);

    const promedioActividades = useMemo(() => {
        return calculatePromedio(activeEstudiante.actividadesPlan);
    }, [activeEstudiante.actividadesPlan]);

    const promedioGeneralConsolidado = useMemo(() => {
        const c = parseFloat(promedioCognitivos) || 0;
        const p = parseFloat(promedioProcedimentales) || 0;
        const a = parseFloat(promedioActividades) || 0;
        const count = (c > 0 ? 1 : 0) + (p > 0 ? 1 : 0) + (a > 0 ? 1 : 0);
        if (count === 0) return '0.00';
        return ((c + p + a) / count).toFixed(2);
    }, [promedioCognitivos, promedioProcedimentales, promedioActividades]);

    const getEscalaLabel = (prom: string) => {
        const val = parseFloat(prom);
        if (val >= 3.5) return 'MUY ADECUADO (4)';
        if (val >= 2.5) return 'ADECUADO (3)';
        if (val >= 1.5) return 'POCO ADECUADO (2)';
        if (val > 0) return 'NO ADECUADO (1)';
        return 'SIN EVALUAR';
    };

    const handleExportExcel = async () => {
        await exportLearningPlanToExcel({
            nombreProyecto: formData.NombreProyecto || formData.Titulo || formData.TituloProyecto || 'PROYECTO ISTPET',
            lineaInvestigacion: formData.LineaInvestigacion || 'Línea Institucional',
            sublineaInvestigacion: formData.SublineaInvestigacion || 'Sublínea de Investigación',
            carrera: formData.Carrera || 'Carrera Institucional',
            directorProyecto: formData.DirectorProyecto || 'Director de Proyecto',
            numeroEstudiantes: estudiantesList.length,
            fechaAprobacion: formData.FechaAprobacion || 'DD/MM/AAAA',
            fechaTerminacion: formData.FechaTerminacion || 'DD/MM/AAAA',
            periodoAcademico: formData.PeriodoAcademico || formData.Periodo || '2026',
            nombreEstudiante: activeEstudiante.nombreEstudiante || 'Estudiante 1',
            prerrequisitosCognitivos: activeEstudiante.prerrequisitosCognitivos.map((c) => ({
                descripcion: c.descripcion,
                nivel: c.nivel || 3
            })),
            prerrequisitosProcedimentales: activeEstudiante.prerrequisitosProcedimentales.map((p) => ({
                descripcion: p.descripcion,
                nivel: p.nivel || 3
            })),
            actividadesPlan: activeEstudiante.actividadesPlan.map((a) => ({
                objetivoProyecto: a.objetivoProyecto,
                asignatura: a.asignatura,
                resultadoAprendizaje: a.resultadoAprendizaje,
                actividad: a.actividad,
                fecha: a.fecha,
                nivel: a.nivel || 3,
                observaciones: a.observaciones
            })),
            promedioCognitivos: `${promedioCognitivos} - ${getEscalaLabel(promedioCognitivos)}`,
            promedioProcedimentales: `${promedioProcedimentales} - ${getEscalaLabel(promedioProcedimentales)}`,
            promedioActividades: `${promedioActividades} - ${getEscalaLabel(promedioActividades)}`,
            directorNombre: formData.FirmasResponsabilidad?.DirectorNombre || formData.DirectorProyecto || 'Ing. Director del Proyecto',
            directorTitulo: 'Director del Proyecto',
            coordinadorNombre: formData.FirmasResponsabilidad?.CoordinadorNombre || 'MSc. Christian Castro',
            coordinadorTitulo: 'Coordinador de la Unidad de Investigación'
        });
    };

    return (
        <div className="space-y-6 animate-fade-in text-text-main max-w-6xl mx-auto">
            {/* Cabecera Oficial del Instrumento */}
            <div className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <span className="section-label text-brand">ISTPET — UNIDAD DE INVESTIGACIÓN</span>
                    <h2 className="text-sm sm:text-base font-semibold tracking-tight text-text-main uppercase">
                        {isEvaluationMode
                            ? 'Instrumento de Evaluación del Plan de Aprendizaje de los Estudiantes'
                            : 'Plan de Aprendizaje de Proyecto (Docencia - APE)'}
                    </h2>
                    <p className="text-xs text-text-dim">
                        {isEvaluationMode
                            ? 'Evaluación cualitativa de pertinencia y cumplimiento de articulación con la docencia (APE) — Coordinación de Investigación.'
                            : 'Articulación de la investigación con la docencia, asignaturas vinculadas y prácticas formativas (APE).'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Badge de Estado en Modo Evaluación */}
                    {isEvaluationMode && (
                        estadoAprobacion === 'Aprobado' ? (
                            <span className="badge-vercel-green text-[10px] py-1 px-2.5 font-mono font-semibold">
                                Plan Aprobado
                            </span>
                        ) : estadoAprobacion === 'En Corrección' ? (
                            <span className="badge-vercel-amber text-[10px] py-1 px-2.5 font-mono font-semibold">
                                En Corrección
                            </span>
                        ) : (
                            <span className="badge-vercel-gray text-[10px] py-1 px-2.5 font-mono">
                                Pendiente de Evaluación
                            </span>
                        )
                    )}

                    {/* Controles de Aprobación para Administrador */}
                    {isEvaluationMode && isAdmin && !effectiveReadOnly && (
                        <div className="flex items-center gap-1 bg-surface border border-border-thin p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => onUpdate?.('EstadoAprobacion', 'Aprobado')}
                                className={`text-xs font-medium py-1 px-2.5 rounded transition-all cursor-pointer ${estadoAprobacion === 'Aprobado'
                                    ? 'bg-text-main text-bg-deep font-semibold shadow-sm'
                                    : 'text-text-dim hover:text-text-main'
                                    }`}
                            >
                                Aprobar Plan
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdate?.('EstadoAprobacion', 'En Corrección')}
                                className={`text-xs font-medium py-1 px-2.5 rounded transition-all cursor-pointer ${estadoAprobacion === 'En Corrección'
                                    ? 'bg-amber-500/20 text-amber-500 font-semibold border border-amber-500/30'
                                    : 'text-text-dim hover:text-text-main'
                                    }`}
                            >
                                Solicitar Corrección
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="btn-vercel-secondary text-xs py-1.5 px-3 cursor-pointer"
                        title="Descargar formato en Excel (.xlsx)"
                    >
                        Exportar Excel (.xlsx)
                    </button>
                </div>
            </div>

            {/* Pestañas de Estudiantes */}
            <div className="flex items-center justify-between border-b border-border-thin pb-2 gap-2 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-1.5">
                    {estudiantesList.map((est, idx) => (
                        <button
                            key={est.id || idx}
                            type="button"
                            onClick={() => setActiveEstudianteIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeEstudianteIndex === idx
                                ? 'bg-text-main text-bg-deep font-semibold shadow-sm'
                                : 'bg-surface hover:bg-surface-hover text-text-dim hover:text-text-main border border-border-thin'
                                }`}
                        >
                            <span className="font-mono text-[10px] opacity-70 mr-1.5">#{idx + 1}</span>
                            <span>{est.nombreEstudiante || `Estudiante ${idx + 1}`}</span>
                        </button>
                    ))}
                </div>

                {!effectiveReadOnly && !isEvaluationMode && (
                    <button
                        type="button"
                        onClick={handleAddEstudiante}
                        className="btn-vercel-secondary text-xs py-1.5 px-3 shrink-0 cursor-pointer"
                    >
                        + Añadir Estudiante
                    </button>
                )}
            </div>

            {/* 1. IDENTIFICACIÓN DEL PROYECTO & ESTUDIANTE */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin pb-3">
                    <span className="section-label !text-text-main !text-xs !font-bold">
                        1. Identificación del Proyecto & Estudiante
                    </span>
                    {estudiantesList.length > 1 && !effectiveReadOnly && !isEvaluationMode && (
                        <button
                            type="button"
                            onClick={() => handleRemoveEstudiante(activeEstudianteIndex)}
                            className="text-xs text-error hover:underline cursor-pointer"
                        >
                            Eliminar Ficha de este Estudiante
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                        <label className="section-label">Nombre del Proyecto</label>
                        <input
                            type="text"
                            value={formData.NombreProyecto || formData.Titulo || formData.TituloProyecto || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('NombreProyecto', e.target.value)}
                            placeholder="Título oficial del proyecto"
                            className="input-vercel text-xs w-full font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">Línea de Investigación</label>
                        <input
                            type="text"
                            value={formData.LineaInvestigacion || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('LineaInvestigacion', e.target.value)}
                            placeholder="Línea institucional"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">Sublínea de Investigación</label>
                        <input
                            type="text"
                            value={formData.SublineaInvestigacion || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('SublineaInvestigacion', e.target.value)}
                            placeholder="Sublínea técnica"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">Carrera</label>
                        <input
                            type="text"
                            value={formData.Carrera || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('Carrera', e.target.value)}
                            placeholder="Carrera asociada"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">Director del Proyecto</label>
                        <input
                            type="text"
                            value={formData.DirectorProyecto || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('DirectorProyecto', e.target.value)}
                            placeholder="Nombre del director"
                            className="input-vercel text-xs w-full font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">N° Estudiantes en el Proyecto</label>
                        <input
                            type="number"
                            min={1}
                            value={estudiantesList.length}
                            disabled
                            className="input-vercel text-xs w-full font-mono font-bold"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="section-label">Periodo Académico</label>
                        <input
                            type="text"
                            value={formData.PeriodoAcademico || formData.Periodo || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => onUpdate?.('PeriodoAcademico', e.target.value)}
                            placeholder="Ej: ABRIL - SEPTIEMBRE 2026"
                            className="input-vercel text-xs w-full font-mono"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 space-y-1.5 pt-3 border-t border-border-thin">
                        <label className="section-label text-brand">Nombre del Estudiante Asignado</label>
                        <input
                            type="text"
                            value={activeEstudiante.nombreEstudiante || ''}
                            disabled={effectiveReadOnly || isEvaluationMode}
                            onChange={(e) => handleUpdateNombreEstudiante(e.target.value)}
                            placeholder="Apellidos y Nombres del Estudiante"
                            className="input-vercel text-xs w-full font-semibold border-brand/40 focus:border-brand"
                        />
                    </div>
                </div>
            </section>

            {/* 2. PARÁMETROS DE EVALUACIÓN (Visible en Modo Evaluación) */}
            {isEvaluationMode && (
                <section className="bento-card p-6 space-y-3">
                    <span className="section-label !text-text-main !text-xs !font-bold">
                        2. Parámetros de Evaluación Cualitativa (Escala 1 a 4)
                    </span>
                    <p className="text-xs text-text-dim leading-relaxed">
                        La evaluación se centra en los resultados de aprendizaje de las actividades que los estudiantes realizan en articulación con las asignaturas del proyecto.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        <div className="p-3.5 rounded-lg border border-border-thin bg-surface space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-text-main">Nivel 4</span>
                                <span className="badge-vercel-green text-[9px]">MUY ADECUADO</span>
                            </div>
                            <p className="text-[11px] text-text-dim leading-snug">
                                Superó ampliamente las expectativas con desempeño excepcional.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg border border-border-thin bg-surface space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-text-main">Nivel 3</span>
                                <span className="badge-vercel-blue text-[9px]">ADECUADO</span>
                            </div>
                            <p className="text-[11px] text-text-dim leading-snug">
                                Cumplió con las expectativas con buen rendimiento general.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg border border-border-thin bg-surface space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-text-main">Nivel 2</span>
                                <span className="badge-vercel-amber text-[9px]">POCO ADECUADO</span>
                            </div>
                            <p className="text-[11px] text-text-dim leading-snug">
                                Cumplió parcialmente con inconsistencias en el desempeño.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg border border-border-thin bg-surface space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-text-main">Nivel 1</span>
                                <span className="badge-vercel-red text-[9px]">NO ADECUADO</span>
                            </div>
                            <p className="text-[11px] text-text-dim leading-snug">
                                No cumplió expectativas con rendimiento insatisfactorio.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* 3. PRERREQUISITOS PREVIOS A LA VINCULACIÓN */}
            <section className="bento-card p-6 space-y-4">
                <div className="border-b border-border-thin pb-3">
                    <span className="section-label !text-text-main !text-xs !font-bold">
                        {isEvaluationMode ? '3. Evaluación de Prerrequisitos Previos a la Vinculación' : '2. Prerrequisitos Previos a la Vinculación'}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Cognitivos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="section-label">Prerrequisitos Cognitivos</span>
                            {!effectiveReadOnly && !isEvaluationMode && (
                                <button
                                    type="button"
                                    onClick={handleAddCognitivo}
                                    className="text-xs text-brand hover:underline cursor-pointer font-medium"
                                >
                                    + Añadir
                                </button>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {activeEstudiante.prerrequisitosCognitivos.map((cog, idx) => (
                                <div key={cog.id || idx} className="p-3.5 rounded-lg bg-surface border border-border-thin space-y-2.5">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            value={cog.descripcion}
                                            disabled={effectiveReadOnly || isEvaluationMode}
                                            onChange={(e) => handleUpdateCognitivo(idx, 'descripcion', e.target.value)}
                                            placeholder="Descripción del prerrequisito cognitivo..."
                                            className="input-vercel text-xs w-full"
                                        />
                                        {!effectiveReadOnly && !isEvaluationMode && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCognitivo(idx)}
                                                className="text-text-dim hover:text-error text-xs px-1.5 py-1"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {isEvaluationMode && (
                                        <div className="flex items-center justify-between pt-1 border-t border-border-thin/40 text-[11px]">
                                            <span className="text-text-dim font-mono text-[10px]">Nivel de Cumplimiento</span>
                                            <div className="flex items-center gap-3">
                                                {[4, 3, 2, 1].map((lvl) => (
                                                    <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`cog_lvl_${activeEstudiante.id}_${idx}`}
                                                            checked={cog.nivel === lvl}
                                                            disabled={effectiveReadOnly}
                                                            onChange={() => handleUpdateCognitivo(idx, 'nivel', lvl)}
                                                            className="cursor-pointer"
                                                        />
                                                        <span className="font-mono text-xs font-medium">{lvl}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Columna Procedimentales */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="section-label">Prerrequisitos Procedimentales</span>
                            {!effectiveReadOnly && !isEvaluationMode && (
                                <button
                                    type="button"
                                    onClick={handleAddProcedimental}
                                    className="text-xs text-brand hover:underline cursor-pointer font-medium"
                                >
                                    + Añadir
                                </button>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {activeEstudiante.prerrequisitosProcedimentales.map((proc, idx) => (
                                <div key={proc.id || idx} className="p-3.5 rounded-lg bg-surface border border-border-thin space-y-2.5">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            value={proc.descripcion}
                                            disabled={effectiveReadOnly || isEvaluationMode}
                                            onChange={(e) => handleUpdateProcedimental(idx, 'descripcion', e.target.value)}
                                            placeholder="Descripción del prerrequisito procedimental..."
                                            className="input-vercel text-xs w-full"
                                        />
                                        {!effectiveReadOnly && !isEvaluationMode && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProcedimental(idx)}
                                                className="text-text-dim hover:text-error text-xs px-1.5 py-1"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {isEvaluationMode && (
                                        <div className="flex items-center justify-between pt-1 border-t border-border-thin/40 text-[11px]">
                                            <span className="text-text-dim font-mono text-[10px]">Nivel de Cumplimiento</span>
                                            <div className="flex items-center gap-3">
                                                {[4, 3, 2, 1].map((lvl) => (
                                                    <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`proc_lvl_${activeEstudiante.id}_${idx}`}
                                                            checked={proc.nivel === lvl}
                                                            disabled={effectiveReadOnly}
                                                            onChange={() => handleUpdateProcedimental(idx, 'nivel', lvl)}
                                                            className="cursor-pointer"
                                                        />
                                                        <span className="font-mono text-xs font-medium">{lvl}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. PLAN DE APRENDIZAJE (ACTIVIDADES APE) */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin pb-3">
                    <span className="section-label !text-text-main !text-xs !font-bold">
                        {isEvaluationMode ? '4. Evaluación del Plan de Aprendizaje (Actividades Ejecutadas)' : '3. Plan de Aprendizaje (Actividades APE)'}
                    </span>
                    {!effectiveReadOnly && !isEvaluationMode && (
                        <button
                            type="button"
                            onClick={handleAddActividad}
                            className="btn-vercel-secondary text-xs py-1.5 px-3 cursor-pointer"
                        >
                            + Añadir Actividad
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {activeEstudiante.actividadesPlan.map((act, idx) => (
                        <div key={act.id || idx} className="p-4 rounded-xl border border-border-thin bg-surface space-y-3.5">
                            <div className="flex items-center justify-between border-b border-border-thin/40 pb-2">
                                <span className="text-xs font-semibold text-text-main font-mono">
                                    Actividad #{idx + 1}
                                </span>
                                {!effectiveReadOnly && !isEvaluationMode && activeEstudiante.actividadesPlan.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveActividad(idx)}
                                        className="text-text-dim hover:text-error text-xs cursor-pointer"
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                                <div className="space-y-1.5">
                                    <label className="section-label">Objetivo del Proyecto</label>
                                    <textarea
                                        rows={2}
                                        value={act.objetivoProyecto}
                                        disabled={effectiveReadOnly || isEvaluationMode}
                                        onChange={(e) => handleUpdateActividad(idx, 'objetivoProyecto', e.target.value)}
                                        placeholder="Objetivo específico asociado..."
                                        className="input-vercel text-xs w-full resize-none custom-scrollbar"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="section-label">Asignatura</label>
                                    <input
                                        type="text"
                                        value={act.asignatura}
                                        disabled={effectiveReadOnly || isEvaluationMode}
                                        onChange={(e) => handleUpdateActividad(idx, 'asignatura', e.target.value)}
                                        placeholder="Materia / Cátedra"
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="section-label">Resultados de Aprendizaje (RdA)</label>
                                    <textarea
                                        rows={2}
                                        value={act.resultadoAprendizaje}
                                        disabled={effectiveReadOnly || isEvaluationMode}
                                        onChange={(e) => handleUpdateActividad(idx, 'resultadoAprendizaje', e.target.value)}
                                        placeholder="RdA a verificar..."
                                        className="input-vercel text-xs w-full resize-none custom-scrollbar"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="section-label">Actividad Planificada / Ejecutada</label>
                                    <input
                                        type="text"
                                        value={act.actividad}
                                        disabled={effectiveReadOnly || isEvaluationMode}
                                        onChange={(e) => handleUpdateActividad(idx, 'actividad', e.target.value)}
                                        placeholder="Descripción de la tarea práctica..."
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="section-label">Fecha Prevista / Ejecución</label>
                                    <input
                                        type="date"
                                        value={act.fecha}
                                        disabled={effectiveReadOnly || isEvaluationMode}
                                        onChange={(e) => handleUpdateActividad(idx, 'fecha', e.target.value)}
                                        className="input-vercel text-xs w-full font-mono"
                                    />
                                </div>

                                {isEvaluationMode && (
                                    <>
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="section-label">Observaciones del Evaluador</label>
                                            <input
                                                type="text"
                                                value={act.observaciones}
                                                disabled={effectiveReadOnly}
                                                onChange={(e) => handleUpdateActividad(idx, 'observaciones', e.target.value)}
                                                placeholder="Comentarios sobre el desempeño o pertinencia..."
                                                className="input-vercel text-xs w-full"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="section-label">Nivel de Cumplimiento</label>
                                            <div className="flex items-center justify-between p-2 rounded-lg border border-border-thin bg-bg-deep">
                                                {[4, 3, 2, 1].map((lvl) => (
                                                    <label key={lvl} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`act_lvl_${activeEstudiante.id}_${idx}`}
                                                            checked={act.nivel === lvl}
                                                            disabled={effectiveReadOnly}
                                                            onChange={() => handleUpdateActividad(idx, 'nivel', lvl)}
                                                            className="cursor-pointer"
                                                        />
                                                        <span className="font-mono text-xs font-medium">{lvl}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. RESULTADOS GENERALES (Visible en Modo Evaluación) */}
            {isEvaluationMode && (
                <section className="bento-card p-6 space-y-4">
                    <div className="border-b border-border-thin pb-3 flex items-center justify-between">
                        <span className="section-label !text-text-main !text-xs !font-bold">
                            5. Resultados Generales (Consolidado ISTPET)
                        </span>
                        <span className="badge-vercel-blue text-[10px] font-mono">
                            PROMEDIO GENERAL: {promedioGeneralConsolidado}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="section-label">Cognitivos</span>
                            <div className="my-2.5">
                                <span className="stat-number !text-2xl">{promedioCognitivos}</span>
                                <span className="text-xs text-text-dim font-mono ml-1.5">/ 4.00</span>
                            </div>
                            <span className="badge-vercel-blue text-[10px] w-fit font-mono">{getEscalaLabel(promedioCognitivos)}</span>
                        </div>

                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="section-label">Procedimentales</span>
                            <div className="my-2.5">
                                <span className="stat-number !text-2xl">{promedioProcedimentales}</span>
                                <span className="text-xs text-text-dim font-mono ml-1.5">/ 4.00</span>
                            </div>
                            <span className="badge-vercel-blue text-[10px] w-fit font-mono">{getEscalaLabel(promedioProcedimentales)}</span>
                        </div>

                        <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                            <span className="section-label">Actividades de Aprendizaje</span>
                            <div className="my-2.5">
                                <span className="stat-number !text-2xl">{promedioActividades}</span>
                                <span className="text-xs text-text-dim font-mono ml-1.5">/ 4.00</span>
                            </div>
                            <span className="badge-vercel-blue text-[10px] w-fit font-mono">{getEscalaLabel(promedioActividades)}</span>
                        </div>
                    </div>

                    {/* Dictamen Formal del Evaluador */}
                    <div className="pt-4 border-t border-border-thin space-y-2">
                        <label className="section-label">Dictamen y Recomendación de la Coordinación</label>
                        <textarea
                            rows={3}
                            value={formData.DictamenFinal || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('DictamenFinal', e.target.value)}
                            placeholder="Observaciones finales de pertinencia académica, cumplimiento de carga APE y resolución..."
                            className="input-vercel text-xs w-full resize-none custom-scrollbar"
                        />
                    </div>
                </section>
            )}
        </div>
    );
};

export default LearningPlanSection;
