import React, { useState, useMemo, useContext } from 'react';
import {
    GraduationCap, Plus, Trash2, FileSpreadsheet,
    CheckCircle2, User, Calendar, BookOpen, Layers, Award
} from 'lucide-react';
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
    readOnly = false
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly || cowork.session.readOnly;
    const estadoAprobacion = formData.EstadoAprobacion || 'Pendiente';

    // Lista de fichas de estudiantes
    const estudiantesList: EstudianteEvaluacion[] = useMemo(() => {
        const raw = formData.EstudiantesEvaluaciones;
        if (Array.isArray(raw) && raw.length > 0) return raw;
        // Si no hay fichas aún, inicializar con 1 estudiante por defecto
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

    // Actualizador de fichas de estudiantes en Yjs
    const updateEstudiantesList = (newList: EstudianteEvaluacion[]) => {
        if (effectiveReadOnly) return;
        if (onUpdate) {
            onUpdate('EstudiantesEvaluaciones', newList);
        }
    };

    // Agregar nuevo estudiante
    const handleAddEstudiante = () => {
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly || estudiantesList.length <= 1) return;
        const updated = estudiantesList.filter((_, i) => i !== index);
        updateEstudiantesList(updated);
        setActiveEstudianteIndex(Math.max(0, index - 1));
    };

    // Actualizar nombre del estudiante activo
    const handleUpdateNombreEstudiante = (nombre: string) => {
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
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
        if (effectiveReadOnly) return;
        const updated = [...estudiantesList];
        const currentActs = (updated[activeEstudianteIndex]?.actividadesPlan || []).filter((_, i) => i !== idx);
        updated[activeEstudianteIndex] = {
            ...updated[activeEstudianteIndex],
            actividadesPlan: currentActs
        };
        updateEstudiantesList(updated);
    };

    // Cálculo de Resultados Generales
    const calcAvg = (items: Array<{ nivel: number | null }>) => {
        const valid = items.filter(i => typeof i.nivel === 'number' && i.nivel > 0);
        if (valid.length === 0) return 0;
        const sum = valid.reduce((acc, curr) => acc + (curr.nivel || 0), 0);
        return parseFloat((sum / valid.length).toFixed(2));
    };

    const promedioCognitivos = calcAvg(activeEstudiante.prerrequisitosCognitivos || []);
    const promedioProcedimentales = calcAvg(activeEstudiante.prerrequisitosProcedimentales || []);
    const promedioActividades = calcAvg(activeEstudiante.actividadesPlan || []);

    const getEscalaLabel = (nota: number) => {
        if (nota >= 3.5) return 'MUY ADECUADO (4)';
        if (nota >= 2.5) return 'ADECUADO (3)';
        if (nota >= 1.5) return 'POCO ADECUADO (2)';
        if (nota > 0) return 'NO ADECUADO (1)';
        return 'SIN EVALUAR';
    };

    // Exportar a Excel
    const handleExportExcel = () => {
        exportLearningPlanToExcel({
            nombreProyecto: formData.NombreProyecto || formData.Titulo || formData.TituloProyecto || '',
            lineaInvestigacion: formData.LineaInvestigacion || '',
            sublineaInvestigacion: formData.SublineaInvestigacion || '',
            carrera: formData.Carrera || '',
            directorProyecto: formData.DirectorProyecto || '',
            numeroEstudiantes: estudiantesList.length,
            fechaAprobacion: formData.FechaAprobacion || '',
            fechaTerminacion: formData.FechaTerminacion || '',
            periodoAcademico: formData.PeriodoAcademico || formData.Periodo || '',
            nombreEstudiante: activeEstudiante.nombreEstudiante,
            prerrequisitosCognitivos: activeEstudiante.prerrequisitosCognitivos,
            prerrequisitosProcedimentales: activeEstudiante.prerrequisitosProcedimentales,
            actividadesPlan: activeEstudiante.actividadesPlan,
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
        <div className="space-y-8 animate-fade-in text-text-main">
            {/* Cabecera Oficial del Instrumento ISTPET */}
            <div className="bento-card p-6 bg-gradient-to-r from-surface to-bg-subtle border-border-thin flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="section-label text-brand">ISTPET — UNIDAD DE INVESTIGACIÓN</span>
                        <h2 className="text-base font-bold tracking-tight text-text-main">
                            INSTRUMENTO DE EVALUACIÓN DEL PLAN DE APRENDIZAJE DE LOS ESTUDIANTES
                        </h2>
                        <p className="text-xs text-text-dim mt-0.5">
                            Formato oficial para la articulación cualitativa de proyectos con la docencia (APE).
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Badge de Estado del Plan */}
                    {estadoAprobacion === 'Aprobado' ? (
                        <span className="badge-vercel-green text-xs flex items-center gap-1.5 py-1 px-3">
                            <CheckCircle2 size={13} />
                            <span>Plan Aprobado</span>
                        </span>
                    ) : estadoAprobacion === 'En Corrección' ? (
                        <span className="badge-vercel-amber text-xs flex items-center gap-1.5 py-1 px-3">
                            <span>En Corrección</span>
                        </span>
                    ) : (
                        <span className="badge-vercel-gray text-xs flex items-center gap-1.5 py-1 px-3">
                            <span>Pendiente de Aprobación</span>
                        </span>
                    )}

                    {/* Controles de Aprobación para el Administrador */}
                    {isAdmin && !effectiveReadOnly && (
                        <div className="flex items-center gap-1.5 bg-bg-deep p-1 rounded-lg border border-border-thin">
                            <button
                                type="button"
                                onClick={() => onUpdate?.('EstadoAprobacion', 'Aprobado')}
                                className={`text-xs font-semibold py-1 px-2.5 rounded-md transition-all cursor-pointer ${estadoAprobacion === 'Aprobado'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-text-dim hover:text-emerald-500 hover:bg-emerald-500/10'
                                    }`}
                            >
                                ✓ Aprobar Plan
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdate?.('EstadoAprobacion', 'En Corrección')}
                                className={`text-xs font-semibold py-1 px-2.5 rounded-md transition-all cursor-pointer ${estadoAprobacion === 'En Corrección'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-text-dim hover:text-amber-500 hover:bg-amber-500/10'
                                    }`}
                            >
                                ✎ Solicitar Corrección
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="btn-vercel-primary !bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs flex items-center gap-1.5 py-2 px-3.5 shadow-sm cursor-pointer"
                        title="Descargar formato idéntico en Excel (.xlsx)"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Descargar Excel (.xlsx)</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Estudiantes Evaluados */}
            <div className="flex items-center justify-between border-b border-border-thin pb-2 overflow-x-auto custom-scrollbar gap-2">
                <div className="flex items-center gap-1.5">
                    {estudiantesList.map((est, idx) => (
                        <button
                            key={est.id || idx}
                            type="button"
                            onClick={() => setActiveEstudianteIndex(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeEstudianteIndex === idx
                                ? 'bg-text-main text-bg-deep shadow-sm font-semibold'
                                : 'bg-surface hover:bg-surface-hover text-text-dim hover:text-text-main border border-border-thin'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>{est.nombreEstudiante || `Estudiante ${idx + 1}`}</span>
                        </button>
                    ))}
                </div>

                {!effectiveReadOnly && (
                    <button
                        type="button"
                        onClick={handleAddEstudiante}
                        className="btn-vercel-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir Estudiante
                    </button>
                )}
            </div>

            {/* 1. IDENTIFICACIÓN DEL PROYECTO */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin pb-3">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                            1. Identificación del Proyecto
                        </h3>
                    </div>
                    {estudiantesList.length > 1 && !effectiveReadOnly && (
                        <button
                            type="button"
                            onClick={() => handleRemoveEstudiante(activeEstudianteIndex)}
                            className="text-xs text-error hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar Ficha de este Estudiante
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 lg:col-span-3 space-y-1">
                        <label className="section-label">Nombre del Proyecto</label>
                        <input
                            type="text"
                            value={formData.NombreProyecto || formData.Titulo || formData.TituloProyecto || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('NombreProyecto', e.target.value)}
                            placeholder="Título oficial del proyecto"
                            className="input-vercel text-xs w-full font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">Línea de Investigación</label>
                        <input
                            type="text"
                            value={formData.LineaInvestigacion || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('LineaInvestigacion', e.target.value)}
                            placeholder="Línea institucional"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">Sublínea de Investigación</label>
                        <input
                            type="text"
                            value={formData.SublineaInvestigacion || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('SublineaInvestigacion', e.target.value)}
                            placeholder="Sublínea técnica"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">Carrera</label>
                        <input
                            type="text"
                            value={formData.Carrera || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('Carrera', e.target.value)}
                            placeholder="Carrera asociada"
                            className="input-vercel text-xs w-full"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">Director del Proyecto</label>
                        <input
                            type="text"
                            value={formData.DirectorProyecto || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('DirectorProyecto', e.target.value)}
                            placeholder="Nombre del director"
                            className="input-vercel text-xs w-full font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">N° Estudiantes en el Proyecto</label>
                        <input
                            type="number"
                            min={1}
                            value={estudiantesList.length}
                            disabled
                            className="input-vercel text-xs w-full font-mono font-bold"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="section-label">Periodo Académico</label>
                        <input
                            type="text"
                            value={formData.PeriodoAcademico || formData.Periodo || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => onUpdate?.('PeriodoAcademico', e.target.value)}
                            placeholder="Ej: 2026-1"
                            className="input-vercel text-xs w-full font-mono"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 space-y-1 pt-2 border-t border-border-thin">
                        <label className="section-label text-brand">Nombre del Estudiante Evaluado</label>
                        <input
                            type="text"
                            value={activeEstudiante.nombreEstudiante || ''}
                            disabled={effectiveReadOnly}
                            onChange={(e) => handleUpdateNombreEstudiante(e.target.value)}
                            placeholder="Apellidos y Nombres del Estudiante"
                            className="input-vercel text-xs w-full font-bold text-brand bg-brand/5 border-brand/30"
                        />
                    </div>
                </div>
            </section>

            {/* 2. PARÁMETROS DE EVALUACIÓN */}
            <section className="bento-card p-6 space-y-3 bg-surface/60">
                <div className="flex items-center gap-2 border-b border-border-thin pb-2">
                    <Award className="w-4 h-4 text-brand" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                        2. Parámetros de Evaluación
                    </h3>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">
                    La evaluación de la participación del estudiante en el proyecto de investigación tiene un enfoque cualitativo y se centra en identificar los resultados de aprendizaje de las actividades que los estudiantes deben realizar en conjunto con las asignaturas asociadas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-500 font-mono">4</span>
                            <span className="badge-vercel-green text-[9px]">MUY ADECUADO</span>
                        </div>
                        <p className="text-[11px] text-text-dim leading-snug">
                            Superó ampliamente las expectativas con rendimiento excepcional.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-500 font-mono">3</span>
                            <span className="badge-vercel-blue text-[9px]">ADECUADO</span>
                        </div>
                        <p className="text-[11px] text-text-dim leading-snug">
                            Cumplió con las expectativas con buen rendimiento general.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-500 font-mono">2</span>
                            <span className="badge-vercel-amber text-[9px]">POCO ADECUADO</span>
                        </div>
                        <p className="text-[11px] text-text-dim leading-snug">
                            Cumplió parcialmente con rendimiento inconsistente.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-500 font-mono">1</span>
                            <span className="badge-vercel-red text-[9px]">NO ADECUADO</span>
                        </div>
                        <p className="text-[11px] text-text-dim leading-snug">
                            No cumplió expectativas con rendimiento insatisfactorio.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. PRERREQUISITOS QUE DEBE CUMPLIR EL ESTUDIANTE */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin pb-3">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                            3. Prerrequisitos Previos a la Vinculación al Proyecto
                        </h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Cognitivos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-text-main uppercase font-mono">
                                Prerrequisitos Cognitivos
                            </h4>
                            {!effectiveReadOnly && (
                                <button
                                    type="button"
                                    onClick={handleAddCognitivo}
                                    className="text-[11px] text-brand hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Añadir
                                </button>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {activeEstudiante.prerrequisitosCognitivos.map((cog, idx) => (
                                <div key={cog.id || idx} className="p-3 rounded-lg bg-surface border border-border-thin space-y-2">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            value={cog.descripcion}
                                            disabled={effectiveReadOnly}
                                            onChange={(e) => handleUpdateCognitivo(idx, 'descripcion', e.target.value)}
                                            placeholder="Descripción del prerrequisito cognitivo..."
                                            className="input-vercel text-xs w-full"
                                        />
                                        {!effectiveReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCognitivo(idx)}
                                                className="text-text-dim hover:text-error p-1"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-border-thin/40 text-[11px]">
                                        <span className="text-text-dim font-mono">Nivel:</span>
                                        <div className="flex items-center gap-2">
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
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Columna Procedimentales */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-text-main uppercase font-mono">
                                Prerrequisitos Procedimentales
                            </h4>
                            {!effectiveReadOnly && (
                                <button
                                    type="button"
                                    onClick={handleAddProcedimental}
                                    className="text-[11px] text-brand hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Añadir
                                </button>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            {activeEstudiante.prerrequisitosProcedimentales.map((proc, idx) => (
                                <div key={proc.id || idx} className="p-3 rounded-lg bg-surface border border-border-thin space-y-2">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="text"
                                            value={proc.descripcion}
                                            disabled={effectiveReadOnly}
                                            onChange={(e) => handleUpdateProcedimental(idx, 'descripcion', e.target.value)}
                                            placeholder="Descripción del prerrequisito procedimental..."
                                            className="input-vercel text-xs w-full"
                                        />
                                        {!effectiveReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProcedimental(idx)}
                                                className="text-text-dim hover:text-error p-1"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-border-thin/40 text-[11px]">
                                        <span className="text-text-dim font-mono">Nivel:</span>
                                        <div className="flex items-center gap-2">
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. PLAN DE APRENDIZAJE */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-thin pb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                            4. Plan de Aprendizaje
                        </h3>
                    </div>
                    {!effectiveReadOnly && (
                        <button
                            type="button"
                            onClick={handleAddActividad}
                            className="btn-vercel-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Añadir Actividad
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {activeEstudiante.actividadesPlan.map((act, idx) => (
                        <div key={act.id || idx} className="p-4 rounded-xl border border-border-thin bg-surface space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand font-mono">
                                    Actividad #{idx + 1}
                                </span>
                                {!effectiveReadOnly && activeEstudiante.actividadesPlan.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveActividad(idx)}
                                        className="text-text-dim hover:text-error text-xs flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-1">
                                    <label className="section-label">Objetivo del Proyecto</label>
                                    <textarea
                                        rows={2}
                                        value={act.objetivoProyecto}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'objetivoProyecto', e.target.value)}
                                        placeholder="Objetivo específico asociado..."
                                        className="input-vercel text-xs w-full resize-none custom-scrollbar"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="section-label">Asignatura</label>
                                    <input
                                        type="text"
                                        value={act.asignatura}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'asignatura', e.target.value)}
                                        placeholder="Materia / Cátedra"
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="section-label">Resultados de Aprendizaje (RdA)</label>
                                    <textarea
                                        rows={2}
                                        value={act.resultadoAprendizaje}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'resultadoAprendizaje', e.target.value)}
                                        placeholder="RdA a verificar..."
                                        className="input-vercel text-xs w-full resize-none custom-scrollbar"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="section-label">Actividad Ejecutada por el Estudiante</label>
                                    <input
                                        type="text"
                                        value={act.actividad}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'actividad', e.target.value)}
                                        placeholder="Descripción de la tarea práctica..."
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="section-label">Fecha de Ejecución</label>
                                    <input
                                        type="date"
                                        value={act.fecha}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'fecha', e.target.value)}
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="section-label">Observaciones</label>
                                    <input
                                        type="text"
                                        value={act.observaciones}
                                        disabled={effectiveReadOnly}
                                        onChange={(e) => handleUpdateActividad(idx, 'observaciones', e.target.value)}
                                        placeholder="Comentarios sobre el desempeño..."
                                        className="input-vercel text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1">
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
                                                <span className="font-mono text-xs font-bold">{lvl}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. RESULTADOS GENERALES */}
            <section className="bento-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-border-thin pb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">
                        5. Resultados Generales de la Evaluación
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                        <span className="section-label text-text-dim">Cognitivos</span>
                        <div className="my-2">
                            <span className="text-2xl font-black font-mono text-text-main">{promedioCognitivos}</span>
                            <span className="text-xs text-text-dim ml-1">/ 4.00</span>
                        </div>
                        <span className="text-xs font-semibold text-brand">{getEscalaLabel(promedioCognitivos)}</span>
                    </div>

                    <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                        <span className="section-label text-text-dim">Procedimentales</span>
                        <div className="my-2">
                            <span className="text-2xl font-black font-mono text-text-main">{promedioProcedimentales}</span>
                            <span className="text-xs text-text-dim ml-1">/ 4.00</span>
                        </div>
                        <span className="text-xs font-semibold text-brand">{getEscalaLabel(promedioProcedimentales)}</span>
                    </div>

                    <div className="p-4 rounded-xl border border-border-thin bg-surface flex flex-col justify-between">
                        <span className="section-label text-text-dim">Actividades de Aprendizaje</span>
                        <div className="my-2">
                            <span className="text-2xl font-black font-mono text-text-main">{promedioActividades}</span>
                            <span className="text-xs text-text-dim ml-1">/ 4.00</span>
                        </div>
                        <span className="text-xs font-semibold text-brand">{getEscalaLabel(promedioActividades)}</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LearningPlanSection;
