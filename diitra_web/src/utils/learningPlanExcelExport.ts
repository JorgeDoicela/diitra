import * as XLSX from 'xlsx';
import { downloadBlob } from './downloadUtils';

export interface LearningPlanExportData {
    // 1. Identificación
    nombreProyecto?: string;
    lineaInvestigacion?: string;
    sublineaInvestigacion?: string;
    carrera?: string;
    directorProyecto?: string;
    numeroEstudiantes?: number | string;
    fechaAprobacion?: string;
    fechaTerminacion?: string;
    periodoAcademico?: string;
    nombreEstudiante?: string;

    // 3. Prerrequisitos
    prerrequisitosCognitivos?: Array<{
        descripcion: string;
        nivel: 1 | 2 | 3 | 4 | null;
    }>;
    prerrequisitosProcedimentales?: Array<{
        descripcion: string;
        nivel: 1 | 2 | 3 | 4 | null;
    }>;

    // 4. Plan de Aprendizaje
    actividadesPlan?: Array<{
        objetivoProyecto: string;
        asignatura: string;
        resultadoAprendizaje: string;
        actividad: string;
        fecha: string;
        nivel: 1 | 2 | 3 | 4 | null;
        observaciones: string;
    }>;

    // 5. Resultados Generales
    promedioCognitivos?: number | string;
    promedioProcedimentales?: number | string;
    promedioActividades?: number | string;

    // 6. Firmas
    directorNombre?: string;
    directorTitulo?: string;
    coordinadorNombre?: string;
    coordinadorTitulo?: string;
}

/**
 * Genera y descarga el archivo Excel (.xlsx) oficial del Instrumento de Evaluación
 * del Plan de Aprendizaje de los Estudiantes conforme al estándar ISTPET.
 */
export const exportLearningPlanToExcel = (data: LearningPlanExportData, filename?: string): void => {
    const wb = XLSX.utils.book_new();

    const rows: (string | number)[][] = [];

    // Fila 1: Título superior
    rows.push(['ISTPET - INSTITUTO TRAVERSARI', '', '', '', '', 'UNIDAD DE INVESTIGACIÓN', '', '', '', '']);
    rows.push([]);

    // Fila 3: Título del documento
    rows.push(['INSTRUMENTO DE EVALUACIÓN DEL PLAN DE APRENDIZAJE DE LOS ESTUDIANTES', '', '', '', '', '', '', '', '', '']);
    rows.push([]);

    // Fila 5: 1. IDENTIFICACIÓN DEL PROYECTO
    rows.push(['1. IDENTIFICACIÓN DEL PROYECTO', '', '', '', '', '', '', '', '', '']);
    rows.push(['NOMBRE DEL PROYECTO', data.nombreProyecto || '', '', '', '', '', '', '', '', '']);
    rows.push(['LÍNEA DE INVESTIGACIÓN', data.lineaInvestigacion || '', '', '', '', '', '', '', '', '']);
    rows.push(['SUBLÍNEA DE INVESTIGACIÓN', data.sublineaInvestigacion || '', '', '', '', '', '', '', '', '']);
    rows.push(['CARRERA', data.carrera || '', '', '', '', '', '', '', '', '']);
    rows.push([
        'DIRECTOR DEL PROYECTO', data.directorProyecto || '', '', '', '',
        'NÚMERO DE ESTUDIANTES QUE PARTICIPAN EN EL PROYECTO DE INVESTIGACIÓN', data.numeroEstudiantes ?? 1, '', '', ''
    ]);
    rows.push([
        'FECHA DE APROBACIÓN', data.fechaAprobacion || '',
        'FECHA DE TERMINACIÓN', data.fechaTerminacion || '',
        'PERIODO ACADÉMICO', data.periodoAcademico || '', '', '', '', ''
    ]);
    rows.push(['NOMBRE DEL ESTUDIANTE', data.nombreEstudiante || '', '', '', '', '', '', '', '', '']);
    rows.push([]);

    // 2. PARÁMETROS DE EVALUACIÓN
    rows.push(['2. PARÁMETROS DE EVALUACIÓN', '', '', '', '', '', '', '', '', '']);
    rows.push([
        'La evaluación de la participación del estudiante en el proyecto de investigación tiene un enfoque cualitativo y se centra en identificar los resultados de aprendizaje de las actividades que los estudiantes deben realizar en conjunto con las asignaturas asociadas.',
        '', '', '', '', '', '', '', '', ''
    ]);
    rows.push(['Los parámetros considerados para evaluar la participación del estudiante son:', '', '', '', '', '', '', '', '', '']);
    rows.push(['4', 'MUY ADECUADO', 'El estudiante ha superado ampliamente las expectativas, mostrando un rendimiento excepcional en todas las actividades asignadas.', '', '', '', '', '', '', '']);
    rows.push(['3', 'ADECUADO', 'El estudiante ha cumplido con las expectativas, mostrando un buen rendimiento en la mayoría de las actividades, con algunos aspectos a mejorar.', '', '', '', '', '', '', '']);
    rows.push(['2', 'POCO ADECUADO', 'El estudiante ha cumplido parcialmente con las expectativas, mostrando un rendimiento inconsistente y necesitando mejoras significativas.', '', '', '', '', '', '', '']);
    rows.push(['1', 'NO ADECUADO', 'El estudiante no ha cumplido con las expectativas, mostrando un rendimiento insatisfactorio en la mayoría de las actividades.', '', '', '', '', '', '', '']);
    rows.push([]);

    // 3. PRERREQUISITOS QUE DEBE CUMPLIR EL ESTUDIANTE PREVIO A LA VINCULACIÓN
    rows.push(['3. PRERREQUISITOS QUE DEBE CUMPLIR EL ESTUDIANTE PREVIO A LA VINCULACIÓN AL PROYECTO', '', '', '', '', '', '', '', '', '']);
    rows.push([
        'COGNITIVOS', 'NIVEL DE CUMPLIMIENTO', '', '', '',
        'PROCEDIMENTALES', 'NIVEL DE CUMPLIMIENTO', '', '', ''
    ]);
    rows.push([
        '', 'MUY ADECUADO (4)', 'ADECUADO (3)', 'POCO ADECUADO (2)', 'NO ADECUADO (1)',
        '', 'MUY ADECUADO (4)', 'ADECUADO (3)', 'POCO ADECUADO (2)', 'NO ADECUADO (1)'
    ]);

    const cogList = data.prerrequisitosCognitivos || [];
    const procList = data.prerrequisitosProcedimentales || [];
    const maxPrereq = Math.max(cogList.length, procList.length, 3);

    for (let i = 0; i < maxPrereq; i++) {
        const cog = cogList[i];
        const proc = procList[i];

        const cogMarks = [
            cog?.nivel === 4 ? 'X' : '',
            cog?.nivel === 3 ? 'X' : '',
            cog?.nivel === 2 ? 'X' : '',
            cog?.nivel === 1 ? 'X' : ''
        ];

        const procMarks = [
            proc?.nivel === 4 ? 'X' : '',
            proc?.nivel === 3 ? 'X' : '',
            proc?.nivel === 2 ? 'X' : '',
            proc?.nivel === 1 ? 'X' : ''
        ];

        rows.push([
            cog?.descripcion || '', ...cogMarks,
            proc?.descripcion || '', ...procMarks
        ]);
    }
    rows.push([]);

    // 4. PLAN DE APRENDIZAJE
    rows.push(['4. PLAN DE APRENDIZAJE', '', '', '', '', '', '', '', '', '']);
    rows.push([
        'OBJETIVOS DEL PROYECTO DE INVESTIGACIÓN',
        'ASIGNATURA',
        'RESULTADOS DE APRENDIZAJE ASOCIADO',
        'ACTIVIDAD EJECUTADA POR EL ESTUDIANTE', '',
        'NIVEL DE CUMPLIMIENTO', '', '', '',
        'OBSERVACIONES'
    ]);
    rows.push([
        '', '', '',
        'ACTIVIDAD', 'FECHA',
        'MUY ADECUADO (4)', 'ADECUADO (3)', 'POCO ADECUADO (2)', 'NO ADECUADO (1)',
        ''
    ]);

    const actList = data.actividadesPlan || [];
    const maxActs = Math.max(actList.length, 3);

    for (let i = 0; i < maxActs; i++) {
        const act = actList[i];
        const actMarks = [
            act?.nivel === 4 ? 'X' : '',
            act?.nivel === 3 ? 'X' : '',
            act?.nivel === 2 ? 'X' : '',
            act?.nivel === 1 ? 'X' : ''
        ];

        rows.push([
            act?.objetivoProyecto || '',
            act?.asignatura || '',
            act?.resultadoAprendizaje || '',
            act?.actividad || '',
            act?.fecha || '',
            ...actMarks,
            act?.observaciones || ''
        ]);
    }
    rows.push([]);

    // 5. RESULTADOS GENERALES
    rows.push(['5. RESULTADOS GENERALES', '', '', '', '', '', '', '', '', '']);
    rows.push(['COGNITIVOS', data.promedioCognitivos ?? '', '', '', '', '', '', '', '', '']);
    rows.push(['PROCEDIMENTALES', data.promedioProcedimentales ?? '', '', '', '', '', '', '', '', '']);
    rows.push(['ACTIVIDADES DE APRENDIZAJE', data.promedioActividades ?? '', '', '', '', '', '', '', '', '']);
    rows.push([]);
    rows.push([]);

    // 6. FIRMAS DE RESPONSABILIDAD
    rows.push(['Elaborado por:', '', '', '', '', 'Revisado por:', '', '', '', '']);
    rows.push([]);
    rows.push([]);
    rows.push([
        `____________________________________`, '', '', '', '',
        `____________________________________`, '', '', '', ''
    ]);
    rows.push([
        data.directorNombre || 'Ing. Director del Proyecto', '', '', '', '',
        data.coordinadorNombre || 'MSc. Christian Castro', '', '', '', ''
    ]);
    rows.push([
        data.directorTitulo || 'Director del Proyecto', '', '', '', '',
        data.coordinadorTitulo || 'Coordinador de la Unidad de Investigación', '', '', '', ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Ajustar anchos de columnas
    ws['!cols'] = [
        { wch: 32 }, // A: Objetivos / Cognitivos / Campos
        { wch: 20 }, // B: Asignatura / Nivel 4
        { wch: 30 }, // C: RdA / Nivel 3
        { wch: 25 }, // D: Actividad / Nivel 2
        { wch: 15 }, // E: Fecha / Nivel 1
        { wch: 32 }, // F: Procedimentales / Nivel 4
        { wch: 16 }, // G: Nivel 3
        { wch: 16 }, // H: Nivel 2
        { wch: 16 }, // I: Nivel 1
        { wch: 25 }  // J: Observaciones
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Plan de Aprendizaje');

    // Generar buffer y descargar
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const finalName = filename || `2. Plan de Aprendizaje - ${data.nombreEstudiante || 'Estudiante'}.xlsx`;

    downloadBlob(blob, finalName);
};
