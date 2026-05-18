import { BookOpen, FileText, Users, DollarSign, Calendar, Target, CheckSquare, BarChart } from 'lucide-react';
import { GeneralSection } from '../../../components/DIITRA/sections/GeneralSection';
import { TechnicalSection } from '../../../components/DIITRA/sections/TechnicalSection';
import { TeamSection } from '../../../components/DIITRA/sections/TeamSection';
import { BudgetSection } from '../../../components/DIITRA/sections/BudgetSection';
import { TimelineSection } from '../../../components/DIITRA/sections/TimelineSection';
import { ImpactSection } from '../../../components/DIITRA/sections/ImpactSection';

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
            // { id: 'evaluacion', label: 'Evaluación Técnica', icon: CheckSquare, component: RubricSection }
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
            // { id: 'ejecucion', label: 'Avance de Ejecución', icon: BarChart, component: ProgressSection }
        ]
    }
};
