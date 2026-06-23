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
    iconName: string;         // Nombre del ícono de Lucide (ej: 'BookOpen')
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
            { id: 'identificacion', label: 'Identificación',          iconName: 'BookOpen'   },
            { id: 'equipo',         label: 'Equipo Humano',            iconName: 'Users'      },
            { id: 'tecnico',        label: 'Plan Técnico',             iconName: 'FileText'   },
            { id: 'recursos',       label: 'Recursos & Financiamiento', iconName: 'DollarSign' },
            { id: 'impactos',       label: 'Impacto & Productos',      iconName: 'Target'     },
            { id: 'cronograma',     label: 'Cronograma (Gantt)',        iconName: 'Calendar'   },
            { id: 'bibliografia',   label: 'Bibliografía & Firmas',    iconName: 'Library'    },
        ]
    },

    RUBRICA_EVALUACION: {
        title: "Rúbrica de Evaluación por Pares",
        subtitle: "Evaluación anónima (Fase 2) — Normativa CACES",
        schema: {
            Pertinencia: 0,
            Metodologia: 0,
            Viabilidad: 0,
            Impacto: 0,
            ComentariosGenerales: '',
            RecomendacionFinal: ''
        },
        lists: [],
        sections: [
            {
                id: 'evaluacion',
                label: 'Evaluación Técnica',
                iconName: 'CheckSquare',
                config: {
                    referenceTemplateCode: 'PROTOCOLO_INVESTIGACION',
                    fields: [
                        { name: 'Pertinencia',          label: 'Pertinencia Social (0-25)',               type: 'number',   collaborative: false, min: 0, max: 25 },
                        { name: 'Metodologia',          label: 'Metodología Científica (0-25)',            type: 'number',   collaborative: false, min: 0, max: 25 },
                        { name: 'Viabilidad',           label: 'Viabilidad y Presupuesto (0-25)',          type: 'number',   collaborative: false, min: 0, max: 25 },
                        { name: 'Impacto',              label: 'Impacto y Transferencia (0-25)',           type: 'number',   collaborative: false, min: 0, max: 25 },
                        { name: 'ComentariosGenerales', label: 'Observaciones y comentarios institucionales', type: 'textarea', collaborative: false, placeholder: 'Escriba un informe cualitativo para fundamentar las puntuaciones...' },
                        { name: 'RecomendacionFinal',   label: 'Recomendación Final de Comisión',         type: 'select',   collaborative: false, options: ['Aprobado sin modificaciones', 'Aprobado con observaciones menores', 'Requiere re-estructuración mayor', 'Rechazado'] }
                    ]
                }
            }
        ]
    },

    INFORME_AVANCE: {
        title: "Informe de Avance de Proyecto",
        subtitle: "Ejecución y Monitoreo (Fase 3)",
        schema: {
            // Sección 1: Bitácora Científica (rich-text colaborativo)
            ConclusionesParciales: '',
            // Sección 2: Actividades del Cronograma (hitos CACES con % avance)
            HitosCompletados: [],
            // Sección 3: Evidencias Físicas (bitácoras de campo y laboratorio)
            Evidencias: [],
            // Sección 4: Ejecución Presupuestaria (libro contable por partidas)
            PresupuestoEjecutado: [],
        },
        lists: ['HitosCompletados', 'Evidencias', 'PresupuestoEjecutado'],
        // Una sola sección que renderiza ProgressReportSection con las 4 sub-secciones CACES
        sections: [
            {
                id: 'ejecucion',
                label: 'Avance de Ejecución',
                iconName: 'BarChart',
                config: {
                    fields: [
                        {
                            name: 'ConclusionesParciales',
                            label: 'Bitácora Científica & Conclusiones Parciales',
                            type: 'rich-text',
                            collaborative: true,
                            placeholder: 'Documenta el progreso experimental, hallazgos y avances teórico-prácticos del período...'
                        }
                    ]
                }
            }
        ]
    },

    INFORME_FINAL_INVESTIGACION: {
        title: "Informe Final de Investigación",
        subtitle: "Cierre y entrega de resultados - ISTPET",
        schema: {
            resumen_ejecutivo: '',
            cumplimiento_objetivos: '',
            resultados: '',
            discusion: '',
            impacto_final: '',
            transferencia_conocimiento: '',
            conclusiones: '',
            recomendaciones: '',
            bibliografia_final: ''
        },
        lists: [],
        sections: [
            {
                id: 'resumen',
                label: 'Resumen & Objetivos',
                iconName: 'FileText',
                config: {
                    fields: [
                        { name: 'resumen_ejecutivo',      label: 'Resumen Ejecutivo',                        type: 'rich-text', collaborative: true, placeholder: 'Redacte el resumen ejecutivo de la investigación...' },
                        { name: 'cumplimiento_objetivos', label: 'Análisis de Cumplimiento de Objetivos',    type: 'rich-text', collaborative: true, placeholder: 'Detalle cómo se cumplieron cada uno de los objetivos planteados...' }
                    ]
                }
            },
            {
                id: 'resultados',
                label: 'Resultados & Discusión',
                iconName: 'BarChart',
                config: {
                    fields: [
                        { name: 'resultados', label: 'Resultados Obtenidos',   type: 'rich-text', collaborative: true, placeholder: 'Descripción técnica de los hallazgos y resultados...' },
                        { name: 'discusion',  label: 'Discusión de Hallazgos', type: 'rich-text', collaborative: true, placeholder: 'Análisis crítico de los resultados frente al marco teórico inicial...' }
                    ]
                }
            },
            {
                id: 'impacto',
                label: 'Impacto & Cierre',
                iconName: 'Target',
                config: {
                    fields: [
                        { name: 'impacto_final',              label: 'Impacto en la Sociedad / Sector Productivo', type: 'rich-text', collaborative: true, placeholder: 'Describir el impacto real observado tras la ejecución...' },
                        { name: 'transferencia_conocimiento', label: 'Transferencia de Tecnología / Conocimiento',  type: 'rich-text', collaborative: true, placeholder: 'Convenios, prototipos o publicaciones derivadas...' },
                        { name: 'conclusiones',               label: 'Conclusiones Generales',                      type: 'rich-text', collaborative: true, placeholder: 'Conclusiones finales del proyecto...' },
                        { name: 'recomendaciones',            label: 'Recomendaciones',                             type: 'rich-text', collaborative: true, placeholder: 'Sugerencias para futuros desarrollos o líneas de investigación...' },
                        { name: 'bibliografia_final',         label: 'Bibliografía Actualizada (APA)',               type: 'rich-text', collaborative: true, placeholder: 'Listado completo de fuentes bibliográficas utilizadas...' }
                    ]
                }
            }
        ]
    },

    ACTA_COMITE_ETICA: {
        title: "Acta del Comité de Ética de Investigación",
        subtitle: "Evaluación de Pertinencia Ética y Bioética - IST Traversari",
        schema: {
            JustificacionEtica: '',
            RiesgosIdentificados: '',
            MetodoConsentimiento: '',
            DictamenComite: 'Aprobado sin observaciones', // 'Aprobado sin observaciones' | 'Aprobado con sugerencias' | 'Rechazado'
            ObservacionesEspecificas: '',
            MiembrosFirmantes: []
        },
        lists: ['MiembrosFirmantes'],
        sections: [
            {
                id: 'evaluacion_comite',
                label: 'Evaluación de Ética',
                iconName: 'CheckSquare',
                config: {
                    referenceTemplateCode: 'PROTOCOLO_INVESTIGACION',
                    fields: [
                        { name: 'JustificacionEtica',       label: 'Justificación Ética de la Investigación',    type: 'rich-text', collaborative: true, placeholder: 'Describa el impacto ético sobre seres humanos, datos sensibles o animales...' },
                        { name: 'RiesgosIdentificados',      label: 'Identificación y Mitigación de Riesgos',     type: 'rich-text', collaborative: true, placeholder: 'Especifique cualquier riesgo biológico, digital o social y cómo se resolverá...' },
                        { name: 'MetodoConsentimiento',      label: 'Mecanismo de Consentimiento Informado',      type: 'rich-text', collaborative: true, placeholder: 'Detalle cómo se obtendrá el consentimiento firmado de los participantes...' },
                        { name: 'DictamenComite',            label: 'Dictamen Final de Comisión de Ética',         type: 'select',   collaborative: false, options: ['Aprobado sin observaciones', 'Aprobado con sugerencias', 'Rechazado'] },
                        { name: 'ObservacionesEspecificas',  label: 'Observaciones y Requerimientos de Enmienda',  type: 'textarea', collaborative: false, placeholder: 'Escriba cualquier directriz obligatoria que el equipo de investigadores deba aplicar...' }
                    ]
                }
            }
        ]
    }
};
