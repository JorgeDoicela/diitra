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
        sections: [] // Comentado para evitar solapamientos y usar 100% el comportamiento dinámico desde la API
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
        sections: []
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
        sections: []
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
    }
};
