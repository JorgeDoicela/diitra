import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart } from 'lucide-react';
import { GeneralSection } from '../../../components/DIITRA/sections/GeneralSection';
import { TechnicalSection } from '../../../components/DIITRA/sections/TechnicalSection';
import { TeamSection } from '../../../components/DIITRA/sections/TeamSection';
import { BudgetSection } from '../../../components/DIITRA/sections/BudgetSection';
import { TimelineSection } from '../../../components/DIITRA/sections/TimelineSection';
import { ImpactSection } from '../../../components/DIITRA/sections/ImpactSection';
import { AgnosticSection } from '../../../components/DIITRA/sections/AgnosticSection';

// Nota: Las secciones de Rúbrica y Avance se irán creando luego, por ahora dejamos placeholders 
// para demostrar el poder del enrutamiento dinámico (CACES / CES Compliance).

export const DocumentTemplateRegistry: Record<string, any> = {
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
            GrupoInvestigacionTipo: 'NO', // 'NO' | 'SI'
            GrupoInvestigacionNombre: '',
            Dominio: '',
            LineaInvestigacion: '',
            SublineaInvestigacion: '',
            TipoInvestigacion: 'APLICADA', // 'BÁSICA' | 'APLICADA' | 'DESARROLLO EXPERIMENTAL'
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
            Antecedentes: '', // Antecedentes Específicos
            DescripcionProyecto: '', // Descripción del Proyecto
            Justificacion: '', // Justificación
            ObjetivoGeneral: '', // Objetivo General
            ObjetivosEspecificos: '', // Objetivos Específicos
            ObjetivosDesarrolloSostenible: '', // ODS
            MarcoTeorico: '', // Marco Teórico
            Metodologia: '', // Metodología
            Evaluacion: '', // Evaluación

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
            { id: 'identificacion', label: 'Identificación', icon: BookOpen, component: GeneralSection },
            { id: 'tecnico', label: 'Plan Técnico', icon: FileText, component: TechnicalSection },
            { id: 'equipo', label: 'Equipo Humano', icon: Users, component: TeamSection },
            { id: 'recursos', label: 'Recursos & Financiamiento', icon: DollarSign, component: BudgetSection },
            { id: 'cronograma', label: 'Cronograma (Gantt)', icon: Calendar, component: TimelineSection },
            { id: 'impactos', label: 'Impacto & Productos', icon: Target, component: ImpactSection }
        ]
    },
    RUBRICA_EVALUACION: {
        title: "Rúbrica de Evaluación por Pares",
        subtitle: "Revisión doble ciego (Fase 2)",
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
                icon: CheckSquare, 
                component: AgnosticSection,
                config: {
                    referenceTemplateCode: 'PROTOCOLO_INVESTIGACION',
                    fields: [
                        { name: 'Pertinencia', label: 'Pertinencia Social (0-25)', type: 'number', collaborative: false, min: 0, max: 25 },
                        { name: 'Metodologia', label: 'Metodología Científica (0-25)', type: 'number', collaborative: false, min: 0, max: 25 },
                        { name: 'Viabilidad', label: 'Viabilidad y Presupuesto (0-25)', type: 'number', collaborative: false, min: 0, max: 25 },
                        { name: 'Impacto', label: 'Impacto y Transferencia (0-25)', type: 'number', collaborative: false, min: 0, max: 25 },
                        { name: 'ComentariosGenerales', label: 'Observaciones y comentarios institucionales', type: 'textarea', collaborative: false, placeholder: 'Escriba un informe cualitativo para fundamentar las puntuaciones...' },
                        { name: 'RecomendacionFinal', label: 'Recomendación Final de Comisión', type: 'select', collaborative: false, options: ['Aprobado sin modificaciones', 'Aprobado con observaciones menores', 'Requiere re-estructuración mayor', 'Rechazado'] }
                    ]
                }
            }
        ]
    },
    INFORME_AVANCE: {
        title: "Informe de Avance de Proyecto",
        subtitle: "Ejecución y Monitoreo (Fase 3)",
        schema: {
            HitosCompletados: [],
            Evidencias: [],
            PresupuestoEjecutado: [],
            ConclusionesParciales: ''
        },
        lists: ['HitosCompletados', 'Evidencias', 'PresupuestoEjecutado'],
        sections: [
            {
                id: 'ejecucion',
                label: 'Avance de Ejecución',
                icon: BarChart,
                component: AgnosticSection,
                config: {
                    fields: [
                        { name: 'ConclusionesParciales', label: 'Bitácora y Conclusiones Científicas Parciales', type: 'rich-text', collaborative: true },
                        { name: 'Hito_Gantt_Completados', label: 'Validar hito del proyecto', type: 'checkbox', collaborative: true },
                        { name: 'Anexo_Evidencias', label: 'Notas complementarias y anexos', type: 'textarea', collaborative: true, placeholder: 'Describa brevemente las evidencias de laboratorio anexadas al expediente...' }
                    ]
                }
            }
        ]
    },
    INFORME_FINAL_INVESTIGACION: {
        title: "Informe Final de Investigación",
        subtitle: "Cierre y Consolidación de Resultados - ISTPET",
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
                icon: FileText,
                component: AgnosticSection,
                config: {
                    fields: [
                        { name: 'resumen_ejecutivo', label: 'Resumen Ejecutivo', type: 'rich-text', collaborative: true, placeholder: 'Redacte el resumen ejecutivo de la investigación...' },
                        { name: 'cumplimiento_objetivos', label: 'Análisis de Cumplimiento de Objetivos', type: 'rich-text', collaborative: true, placeholder: 'Detalle cómo se cumplieron cada uno de los objetivos planteados...' }
                    ]
                }
            },
            {
                id: 'resultados',
                label: 'Resultados & Discusión',
                icon: BarChart,
                component: AgnosticSection,
                config: {
                    fields: [
                        { name: 'resultados', label: 'Resultados Obtenidos', type: 'rich-text', collaborative: true, placeholder: 'Descripción técnica de los hallazgos y resultados...' },
                        { name: 'discusion', label: 'Discusión de Hallazgos', type: 'rich-text', collaborative: true, placeholder: 'Análisis crítico de los resultados frente al marco teórico inicial...' }
                    ]
                }
            },
            {
                id: 'impacto',
                label: 'Impacto & Cierre',
                icon: Target,
                component: AgnosticSection,
                config: {
                    fields: [
                        { name: 'impacto_final', label: 'Impacto en la Sociedad / Sector Productivo', type: 'rich-text', collaborative: true, placeholder: 'Describir el impacto real observado tras la ejecución...' },
                        { name: 'transferencia_conocimiento', label: 'Transferencia de Tecnología / Conocimiento', type: 'rich-text', collaborative: true, placeholder: 'Convenios, prototipos o publicaciones derivadas...' },
                        { name: 'conclusiones', label: 'Conclusiones Generales', type: 'rich-text', collaborative: true, placeholder: 'Conclusiones finales del proyecto...' },
                        { name: 'recomendaciones', label: 'Recomendaciones', type: 'rich-text', collaborative: true, placeholder: 'Sugerencias para futuros desarrollos o líneas de investigación...' },
                        { name: 'bibliografia_final', label: 'Bibliografía Actualizada (APA)', type: 'rich-text', collaborative: true, placeholder: 'Listado completo de fuentes bibliográficas utilizadas...' }
                    ]
                }
            }
        ]
    }
};
