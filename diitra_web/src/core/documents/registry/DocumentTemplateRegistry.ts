// ═══════════════════════════════════════════════════════════════════
// DIITRA — Document Template Registry (Esquemas de Datos)
//
// RESPONSABILIDAD ÚNICA: Definir la ESTRUCTURA de cada tipo de documento.
//   - Esquema inicial de campos (schema)
//   - Listas colaborativas (lists)
//   - Secciones con sus IDs y labels
//   - Configuración de campos para AgnosticSection (config.fields)
//
// ESTE ARCHIVO NO IMPORTA COMPONENTES REACT.
// Los componentes de React para cada sección están en:
//   → DocumentComponentRegistry.ts
//
// Esto permite que este archivo se use en:
//   - Tests unitarios sin necesidad de React/DOM
//   - Generadores de scripts del backend
//   - Validadores de esquemas
//   - Documentación generada automáticamente
// ═══════════════════════════════════════════════════════════════════

export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'rich-text' | 'list';
    collaborative: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: string[];
}

export interface SectionSchema {
    id: string;
    label: string;
    iconName?: string;         // Nombre del ícono de Lucide (ej: 'BookOpen')
    icon_name?: string;
    componentName?: string;
    component_name?: string;
    config?: {
        referenceTemplateCode?: string;
        fields?: FieldConfig[];
    };
}

export interface DocumentSchema {
    title: string;
    subtitle: string;
    schema: Record<string, any>;
    lists: string[];
    sections: SectionSchema[];
}

export const DocumentTemplateRegistry: Record<string, DocumentSchema> = {
    PROTOCOLO_INVESTIGACION: {
        title: "Proyecto de Investigación",
        subtitle: "Formulación del Proyecto de Investigación - ISTPET",
        schema: {
            // Sección 1: Identificación
            Titulo: '',
            IdCarrera: 0,
            IdConvocatoria: 0,
            Periodo: '',
            TiempoEjecucion: '',
            Programa: '',
            GrupoInvestigacionTipo: 'NO',       // 'NO' | 'SI'
            GrupoInvestigacionNombre: '',
            Dominio: '',
            LineaInvestigacion: '',
            SublineaInvestigacion: '',
            TipoInvestigacion: 'APLICADA',       // 'BÁSICA' | 'APLICADA' | 'DESARROLLO EXPERIMENTAL'
            CampoAmplio: '',
            CampoEspecifico: '',
            CampoDetallado: '',
            DirectorProyecto: '',
            FechaPresentacion: '',
            FechaInicio: '',
            FechaFin: '',

            // Sección 2: Investigadores
            Investigadores: [],

            // Sección 3: Especificación Técnica
            Antecedentes: '',
            DescripcionProyecto: '',
            Justificacion: '',
            ObjetivoGeneral: '',
            ObjetivosEspecificos: '',
            ObjetivosDesarrolloSostenible: '',
            MarcoTeorico: '',
            Metodologia: '',
            Evaluacion: '',

            // Sección 4: Recursos, Costo y Financiamiento
            RecursosDisponibles: [],
            RecursosNecesarios: [],
            CostoTotal: 0,
            FinanciamientoIstpet: false,
            FinanciamientoOtrasFuentes: false,
            NombresOtrasFuentes: '',

            // Sección 5: Productos Esperados
            ProductosEsperados: [],

            // Sección 6: Impactos
            Impacto: { social: '', cientifico: '', economico: '', politico: '', ambiental: '', otro: '' },

            // Sección 7: Cronograma
            Cronograma: [],

            // Sección 8: Bibliografía
            Bibliografia: '',

            // Sección 9: Firmas de Responsabilidad
            FirmasResponsabilidad: {
                DirectorNombre: '',
                DirectorCargo: 'Director del Proyecto',
                CoordinadorNombre: '',
                CoordinadorCargo: 'Coordinador de Carrera'
            }
        },
        lists: ['Investigadores', 'RecursosDisponibles', 'RecursosNecesarios', 'Cronograma', 'ProductosEsperados'],
        sections: [
            { id: 'identificacion', label: 'Identificación', iconName: 'FileText', componentName: 'ProjectGeneralSection' },
            { id: 'investigadores', label: 'Investigadores', iconName: 'Users', componentName: 'ResearchersSection' },
            { id: 'especificacion', label: 'Especificación', iconName: 'Layers', componentName: 'ProjectTechnicalSection' },
            { id: 'recursos', label: 'Recursos y Presupuesto', iconName: 'DollarSign', componentName: 'ProjectBudgetSection' },
            { id: 'productos', label: 'Productos Esperados', iconName: 'Package', componentName: 'ExpectedProductsSection' },
            { id: 'impactos', label: 'Impactos', iconName: 'TrendingUp', componentName: 'ImpactsSection' },
            { id: 'cronograma', label: 'Cronograma (Gantt)', iconName: 'Calendar', componentName: 'GanttSection' },
            { id: 'bibliografia', label: 'Bibliografía', iconName: 'BookOpen', componentName: 'AgnosticSection' },
            { id: 'firmas', label: 'Firmas de Responsabilidad', iconName: 'PenTool', componentName: 'SignaturesSection' }
        ]
    },

    PROTOCOLO_INNOVACION: {
        title: "Proyecto de Innovación",
        subtitle: "Formulación del Proyecto de Innovación y Transferencia - ISTPET",
        schema: {
            // Sección 1: Identificación
            Titulo: '',
            CodigoInstitucional: '',
            IdCarrera: 0,
            Carrera: '',
            IdConvocatoria: 0,
            PeriodoConvocatoria: '',
            TiempoEjecucion: '',
            Programa: '',
            GrupoInvestigacionTipo: 'NO',       // 'NO' | 'SI'
            GrupoInvestigacionNombre: '',
            TipoInnovacion: 'PRODUCTO',          // 'PRODUCTO' | 'PROCESO' | 'ORGANIZATIVA' | 'COMERCIAL'
            LineaInvestigacion: '',
            SublineaInvestigacion: '',
            CampoAmplio: '',
            CampoEspecifico: '',
            CampoDetallado: '',
            Alcance: 'INSTITUCIONAL',            // 'INSTITUCIONAL' | 'LOCAL' | 'COMUNITARIO' | 'REGIONAL'
            DirectorProyecto: '',
            FechaPresentacion: '',
            FechaInicioPrevista: '',
            FechaFinPrevista: '',

            // Sección 2: Investigadores
            Investigadores: [],

            // Sección 3: Descripción del Proyecto
            ResumenProyecto: '',
            ObjetivoGeneral: '',
            ObjetivosEspecificos: '',
            Antecedentes: '',
            JustificacionInnovacion: '',
            DescripcionInnovacion: '',
            VinculacionSociedad: '',
            ConvenioAsociado: '',
            EstadoArteConceptual: '',
            MetodologiaAplicacion: '',
            MetodologiaEvaluacion: '',
            Beneficiarios: '',
            ResultadosEsperados: [],
            Viabilidad: '',
            TransferenciaConocimiento: '',

            // Sección 4: Recursos, Costo y Financiamiento
            RecursosDisponibles: [],
            RecursosNecesarios: [],
            CostoTotal: 0,
            FinanciamientoIstpet: false,
            FinanciamientoOtrasFuentes: false,
            NombresOtrasFuentes: '',

            // Sección 5: Impactos
            Impacto: { social: '', cientifico: '', economico: '', ambiental: '', otro: '' },

            // Sección 6: Firmas de Responsabilidad
            FirmasResponsabilidad: {
                DirectorNombre: '',
                DirectorCargo: 'Director del Proyecto de Innovación',
                CoordinadorNombre: '',
                CoordinadorCargo: 'Coordinador de Innovación y Transferencia'
            }
        },
        lists: ['Investigadores', 'RecursosDisponibles', 'RecursosNecesarios', 'ResultadosEsperados'],
        sections: [
            { id: 'identificacion', label: 'Identificación', iconName: 'FileText', componentName: 'InnovationGeneralSection' },
            { id: 'investigadores', label: 'Investigadores', iconName: 'Users', componentName: 'ResearchersSection' },
            { id: 'descripcion', label: 'Descripción del Proyecto', iconName: 'Layers', componentName: 'InnovationDescriptionSection' },
            { id: 'recursos', label: 'Recursos y Presupuesto', iconName: 'DollarSign', componentName: 'ProjectBudgetSection' },
            { id: 'impactos', label: 'Impactos', iconName: 'TrendingUp', componentName: 'ImpactsSection' },
            { id: 'firmas', label: 'Firmas de Responsabilidad', iconName: 'PenTool', componentName: 'SignaturesSection' }
        ]
    },

    RUBRICA_EVALUACION: {
        title: "Rúbrica de Evaluación por Pares",
        subtitle: "Evaluación anónima (Fase 2) — Normativa CACES",
        schema: {
            criterios_evaluados: [],
            ComentariosGenerales: '',
            RecomendacionFinal: ''
        },
        lists: ['criterios_evaluados'],
        sections: []
    },

    INFORME_AVANCE: {
        title: "Informe de Avance de Proyecto",
        subtitle: "Ejecución y Monitoreo (Fase 3)",
        schema: {
            // Sección 1: Bitácora Científica & Actividades Ejecutadas
            ConclusionesParciales: '',
            ActividadesEjecutadas: [],
            ActividadesNoPrevistas: [],
            Obstaculos: [],
            
            // Sección 2: Estado de Ejecución
            EstadoEjecucion: 'EN AVANCE',
            DescripcionFaseActual: '',
            
            // Sección 3: Observaciones y Roles
            ObservacionesDirector: '',
            ObservacionesCoordinador: '',
            
            // Legacy / Compatibilidad
            HitosCompletados: [],
            Evidencias: [],
            PresupuestoEjecutado: [],
        },
        lists: ['ActividadesEjecutadas', 'ActividadesNoPrevistas', 'Obstaculos', 'HitosCompletados', 'Evidencias', 'PresupuestoEjecutado'],
        sections: [
            { id: 'avance_bitacora', label: 'Bitácora Científica', iconName: 'FileText', componentName: 'ProgressLogSection' },
            { id: 'avance_estado', label: 'Estado de Ejecución', iconName: 'CheckCircle', componentName: 'ProgressStateSection' },
            { id: 'avance_observaciones', label: 'Observaciones y Firmas', iconName: 'PenTool', componentName: 'ProgressObservationsSection' }
        ]
    },

    INFORME_FINAL_INVESTIGACION: {
        title: "Informe Final de Investigación",
        subtitle: "Cierre y entrega de resultados - ISTPET",
        schema: {
            Indice: '',
            Resumen: '',
            Introduccion: '',
            Objetivos: '',
            Fundamentos: '',
            Metodos: '',
            Resultados: '',
            Productos: '',
            Impactos: '',
            Transferencia: '',
            InformeFinanciero: '',
            Conclusiones: '',
            Recomendaciones: '',
            Bibliografia: '',
            Anexos: ''
        },
        lists: [],
        sections: [
            { id: 'sec_indice', label: 'Índice y Estructura', iconName: 'List', componentName: 'AgnosticSection' },
            { id: 'sec_resumen', label: 'Resumen Ejecutivo', iconName: 'FileText', componentName: 'AgnosticSection' },
            { id: 'sec_introduccion', label: 'Introducción', iconName: 'BookOpen', componentName: 'AgnosticSection' },
            { id: 'sec_objetivos', label: 'Objetivos y Cumplimiento', iconName: 'Target', componentName: 'AgnosticSection' },
            { id: 'sec_fundamentos', label: 'Fundamentos Teóricos', iconName: 'Layers', componentName: 'AgnosticSection' },
            { id: 'sec_metodos', label: 'Métodos Aplicados', iconName: 'Sliders', componentName: 'AgnosticSection' },
            { id: 'sec_resultados', label: 'Resultados Obtenidos', iconName: 'Activity', componentName: 'AgnosticSection' },
            { id: 'sec_productos', label: 'Productos Alcanzados', iconName: 'Package', componentName: 'AgnosticSection' },
            { id: 'sec_impactos', label: 'Impactos Finales', iconName: 'TrendingUp', componentName: 'AgnosticSection' },
            { id: 'sec_transferencia', label: 'Transferencia', iconName: 'Share2', componentName: 'AgnosticSection' },
            { id: 'sec_informe_financiero', label: 'Informe Financiero', iconName: 'DollarSign', componentName: 'AgnosticSection' },
            { id: 'sec_conclusiones', label: 'Conclusiones', iconName: 'CheckSquare', componentName: 'AgnosticSection' },
            { id: 'sec_recomendaciones', label: 'Recomendaciones', iconName: 'Award', componentName: 'AgnosticSection' },
            { id: 'sec_bibliografia', label: 'Bibliografía Final', iconName: 'Book', componentName: 'AgnosticSection' },
            { id: 'sec_anexos', label: 'Anexos', iconName: 'Paperclip', componentName: 'AgnosticSection' }
        ]
    },

    OFICIO_APROBACION: {
        title: "Formato Oficio de Aprobación de Proyecto",
        subtitle: "Oficio formal emitido por la Coordinación de Investigación para aprobación legal previa a ejecución",
        schema: {
            oficio_numero: "",
            oficio_fecha: "",
            director_titulo: "Tecnólogo/a",
            director_nombre: "",
            director_carrera: "",
            coordinador_nombre: "Ing. Estefani Sánchez Mgtr."
        },
        lists: [],
        sections: [
            {
                id: 'oficio_aprobacion',
                label: 'Oficio de Aprobación',
                iconName: 'FileText',
                config: {
                    fields: [
                        { name: 'oficio_numero', label: 'Número de Oficio', type: 'text', collaborative: false, placeholder: '01-ISTPET-INV-2026' },
                        { name: 'oficio_fecha', label: 'Fecha de Emisión', type: 'text', collaborative: false, placeholder: 'Ej: 27 de marzo de 2026' },
                        { name: 'director_nombre', label: 'Director del Proyecto (Destinatario)', type: 'text', collaborative: false, placeholder: 'Nombre del docente director' },
                        { name: 'director_carrera', label: 'Carrera del Director', type: 'text', collaborative: false, placeholder: 'Tecnología Superior en...' },
                        { name: 'coordinador_nombre', label: 'Coordinador/a de Investigación (Firmante)', type: 'text', collaborative: false, placeholder: 'Ing. Estefani Sánchez Mgtr.' }
                    ]
                }
            }
        ]
    },

    PLAN_APRENDIZAJE: {
        title: "Plan de Aprendizaje de Proyecto",
        subtitle: "Articulación de la Investigación con la Docencia y Prácticas Formativas (APE) — ISTPET",
        schema: {
            // 1. Identificación del Proyecto
            NombreProyecto: '',
            LineaInvestigacion: '',
            SublineaInvestigacion: '',
            Carrera: '',
            DirectorProyecto: '',
            NumeroEstudiantes: 1,
            FechaAprobacion: '',
            FechaTerminacion: '',
            PeriodoAcademico: '',

            // Estudiante activo seleccionado
            EstudianteActivoId: '',

            // 2. Fichas de Estudiantes
            EstudiantesEvaluaciones: [],

            // 6. Firmas de Responsabilidad
            FirmasResponsabilidad: {
                DirectorNombre: '',
                DirectorCargo: 'Director del Proyecto',
                CoordinadorNombre: 'MSc. Christian Castro',
                CoordinadorCargo: 'Coordinador de la Unidad de Investigación'
            }
        },
        lists: ['EstudiantesEvaluaciones'],
        sections: [
            {
                id: 'plan_aprendizaje',
                label: 'Plan de Aprendizaje',
                iconName: 'BookOpen'
            }
        ]
    },

    EVALUACION_PLAN_APRENDIZAJE: {
        title: "Instrumento de Evaluación del Plan de Aprendizaje",
        subtitle: "Evaluación Cualitativa de Articulación con la Docencia (APE) — Coordinación de Investigación ISTPET",
        schema: {
            // 1. Identificación del Proyecto
            NombreProyecto: '',
            LineaInvestigacion: '',
            SublineaInvestigacion: '',
            Carrera: '',
            DirectorProyecto: '',
            NumeroEstudiantes: 1,
            FechaAprobacion: '',
            FechaTerminacion: '',
            PeriodoAcademico: '',

            // Estudiante activo seleccionado
            EstudianteActivoId: '',

            // 2. Fichas de Evaluación por Estudiante
            EstudiantesEvaluaciones: [],

            // 6. Firmas de Responsabilidad
            FirmasResponsabilidad: {
                DirectorNombre: '',
                DirectorCargo: 'Director del Proyecto',
                CoordinadorNombre: 'MSc. Christian Castro',
                CoordinadorCargo: 'Coordinador de la Unidad de Investigación'
            }
        },
        lists: ['EstudiantesEvaluaciones'],
        sections: [
            {
                id: 'evaluacion_plan_aprendizaje',
                label: 'Evaluación Plan de Aprendizaje',
                iconName: 'Award'
            }
        ]
    }
};
