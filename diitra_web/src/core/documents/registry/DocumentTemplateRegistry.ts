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
        title: "Protocolo de Investigación",
        subtitle: "Formulación del proyecto (Fase 1)",
        schema: {
            Titulo: '',
            IdCarrera: 0,
            IdConvocatoria: 0,
            Periodo: '',
            TiempoEjecucion: '',
            Antecedentes: '',
            ObjetivoGeneral: '',
            Investigadores: [],
            RecursosDisponibles: [],
            RecursosNecesarios: [],
            Cronograma: [],
            ProductosEsperados: [],
            Impacto: { social: '', cientifico: '', economico: '', ambiental: '' },
            CostoTotal: 0
        },
        lists: ['Investigadores', 'RecursosDisponibles', 'RecursosNecesarios', 'Cronograma', 'ProductosEsperados'],
        sections: [
            { id: 'identificacion', label: 'Identificación', icon: BookOpen, component: GeneralSection },
            { id: 'tecnico', label: 'Plan Técnico', icon: FileText, component: TechnicalSection },
            { id: 'equipo', label: 'Equipo Humano', icon: Users, component: TeamSection },
            { id: 'recursos', label: 'Recursos', icon: DollarSign, component: BudgetSection },
            { id: 'cronograma', label: 'Cronograma', icon: Calendar, component: TimelineSection },
            { id: 'impactos', label: 'Impactos', icon: Target, component: ImpactSection }
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
    }
};
