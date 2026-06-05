import { 
    PenTool, BookOpen, Award, Activity
} from 'lucide-react';
import type { HelpConfig, MockupProps } from '../types';

export const INVESTIGACION_CONFIG: HelpConfig = {
    icon: <PenTool size={24} className="text-brand" />,
    title: "Propuestas y Proyectos de I+D+i",
    summary: "Módulo administrativo central para la formulación, registro y postulación de protocolos de investigación y desarrollo.",
    description: "Esta consola proporciona un entorno estructurado para la planificación y postulación de proyectos científicos y tecnológicos de la institución. Permite a los investigadores completar el formulario digital, estructurar los presupuestos detallados por partidas, conformar el equipo de coinvestigadores y adjuntar documentos anexos requeridos por las bases de las convocatorias.",
    steps: [
        {
            title: "Creación y formulación de propuestas de investigación",
            description: "Usa el botón de acción principal 'Nueva Postulación' para lanzar el asistente interactivo. Este formulario te guiará en la definición del título del proyecto, el resumen científico, la justificación metodológica, la selección de la línea de investigación oficial de la institución, el cronograma detallado de entregables y la distribución de recursos económicos por categorías presupuestarias.",
            highlight: 'content-top'
        },
        {
            title: "Buzón de expedientes y contratos firmados",
            description: "Inspecciona el buzón inferior de documentos generados por el núcleo de DIITRA. Aquí se listan en tiempo real los contratos de asignación de fondos, resoluciones del comité científico y actas de aceptación. Todos estos documentos incorporan una firma electrónica válida y certificados de validación criptográfica en formato PDF/A.",
            highlight: 'content-bottom'
        },
        {
            title: "Compilación y envío del Informe Final de Resultados",
            description: "Al completar el cronograma, utiliza la herramienta de cierre para generar tu Informe Final. El sistema compilará automáticamente los entregables aprobados a lo largo del periodo, los informes de monitoreo mensual y te permitirá adjuntar las evidencias físicas del producto científico final (como enlaces a artículos indexados, certificados de ponencias o patentes registradas) antes de enviarlo al comité evaluador.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Alineado con el Criterio B.1.2 (Proyectos de Investigación Científica y Tecnológica) del CACES, asegurando que cada propuesta siga un flujo formal de validación, aprobación colegiada, presupuesto delimitado y asignación clara de metas e investigadores institucionales.",
    tips: [
        "Guarda borradores de tus propuestas de manera local utilizando el guardado automático integrado antes de realizar el envío formal, ya que una vez enviada, la propuesta entrará en estado de bloqueo para edición.",
        "Puedes asociar estudiantes colaboradores en tu postulación para sumar puntos en el indicador de semilleros y fomento a la investigación formativa."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header / Top Content */}
            <div className={`rounded-lg border p-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[5px] text-brand uppercase font-mono tracking-wider font-semibold">Mis Investigaciones</span>
                    <span className="text-[8px] text-text-main font-semibold leading-tight">Proyectos de I+D+i</span>
                </div>
                <div className="h-5 px-2 bg-brand text-white rounded flex items-center justify-center text-[6px] font-bold shadow-sm">
                    + Nueva Postulación
                </div>
            </div>

            {/* Bento cards & DocumentTray / Bottom Content */}
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-2 transition-all duration-300 min-h-0 ${highlightBottomClass}`}>
                {/* Bento Cards Row */}
                <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    <div className="rounded-md border border-border-thin bg-surface-hover/10 p-1.5 flex flex-col gap-1">
                        <div className="w-3.5 h-3.5 rounded bg-brand/10 text-brand flex items-center justify-center text-[7px]">📁</div>
                        <span className="text-[7px] font-bold text-text-main leading-tight uppercase">Mis Proyectos</span>
                        <span className="text-[5px] text-text-dim leading-none uppercase">Expediente Personal</span>
                    </div>
                    <div className="rounded-md border border-border-thin bg-surface-hover/10 p-1.5 flex flex-col gap-1">
                        <div className="w-3.5 h-3.5 rounded bg-brand/10 text-brand flex items-center justify-center text-[7px]">📄</div>
                        <span className="text-[7px] font-bold text-text-main leading-tight uppercase">Informe Final</span>
                        <span className="text-[5px] text-text-dim leading-none uppercase">Consolidación</span>
                    </div>
                </div>

                {/* DocumentTray */}
                <div className="flex-1 flex flex-col gap-1 min-h-0">
                    <span className="text-[6px] font-bold text-text-main uppercase tracking-wider">Documentos Generados</span>
                    <div className="flex-1 border border-dashed border-border-thin rounded bg-surface p-1 space-y-1 overflow-hidden">
                        <div className="flex justify-between items-center py-0.5 border-b border-border-thin/40 text-[5px]">
                            <div className="flex items-center gap-1">
                                <span className="text-brand">📄</span>
                                <span className="text-text-main font-medium truncate max-w-[120px]">CONTRATO_FONDOS_2026.pdf</span>
                            </div>
                            <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded text-[4px] font-semibold">FIRMADO</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5 border-b border-border-thin/40 text-[5px]">
                            <div className="flex items-center gap-1">
                                <span className="text-brand">📄</span>
                                <span className="text-text-main font-medium truncate max-w-[120px]">RESOLUCION_DI-008.pdf</span>
                            </div>
                            <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded text-[4px] font-semibold">FIRMADO</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const MIS_PROYECTOS_CONFIG: HelpConfig = {
    ...INVESTIGACION_CONFIG,
    title: "Mis Proyectos Académicos",
    summary: "Expediente personal e histórico de tus postulaciones e investigaciones activas.",
    description: "Espacio de trabajo personal donde puedes realizar el seguimiento pormenorizado del estado de tus propuestas de investigación. Permite editar borradores inconclusos, revisar las observaciones detalladas emitidas por los revisores pares, cargar los entregables periódicos definidos en tu cronograma y consultar resoluciones oficiales.",
    steps: [
        {
            title: "Ciclo de vida y estados del proyecto",
            description: "Monitorea la columna de estados en la tabla de proyectos. Los estados incluyen: 'Borrador' (permite edición completa y carga de archivos), 'Enviado' (bloqueado para edición, bajo revisión técnica), 'En Ejecución' (aprobado formalmente con presupuesto asignado y cronograma activo), 'Devuelto con Observaciones' (requiere modificaciones del docente) y 'Finalizado' (con informe final aprobado).",
            highlight: 'content-bottom'
        },
        {
            title: "Acceso al Workspace colaborativo en tiempo real",
            description: "Haz clic sobre cualquier proyecto en estado 'En Ejecución' para abrir tu área de trabajo colaborativa. En esta sección podrás registrar las bitácoras de avance semanal, subir informes de hitos del cronograma, cargar facturas de presupuesto y chatear con los miembros del equipo y coinvestigadores asignados.",
            highlight: 'content-bottom'
        },
        {
            title: "Gestión y descarte de borradores",
            description: "En caso de propuestas desestimadas o creadas por error, puedes descartarlas permanentemente directamente desde el menú de acciones de la fila, siempre y cuando se encuentren en estado de 'Borrador'. Esta acción es irreversible y liberará el código temporal del sistema.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Garantiza la inmutabilidad y la trazabilidad de los informes de avance de investigación exigidos por los comités de evaluación del CES y CACES, demostrando el cumplimiento riguroso de las horas docentes dedicadas al desarrollo científico.",
    tips: [
        "Cuando tu propuesta reciba observaciones, haz clic en el botón amarillo de alerta para ver la rúbrica detallada del revisor paso a paso con los comentarios específicos de lo que debes reformular.",
        "Mantén al día la carga de evidencias de avance en tu cronograma para evitar bloqueos administrativos automáticos al final del periodo académico."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Search/Filters Area */}
            <div className={`rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[4px] text-brand uppercase font-mono tracking-wider font-semibold">Mis Investigaciones</span>
                        <span className="text-[7px] text-text-main font-bold">Mis Proyectos de I+D+i</span>
                    </div>
                    <div className="px-1.5 py-0.5 bg-brand text-white rounded text-[5px] font-bold">
                        + Nueva Postulación
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="flex-1 h-3.5 bg-surface-hover/20 border border-border-thin rounded-md px-1 flex items-center gap-1 text-[5px] text-text-dim">
                        🔍 <span className="truncate">Buscar por título...</span>
                    </div>
                    <div className="w-16 h-3.5 bg-surface-hover/20 border border-border-thin rounded-md px-1 flex items-center justify-between text-[4.5px] text-text-main">
                        <span>Todos los estados</span>
                        <span>▼</span>
                    </div>
                </div>
            </div>

            {/* Grid of Projects */}
            <div className={`flex-1 rounded-lg border p-1.5 grid grid-cols-2 gap-1.5 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                {/* Project Card 1 */}
                <div className="rounded-md border border-border-thin bg-surface p-1.5 flex flex-col justify-between hover:border-brand/40 transition-colors">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[4px] font-mono text-text-dim font-bold">
                            <span>PROY-SOFT-2026-001</span>
                            <span>➔</span>
                        </div>
                        <h4 className="text-[5.5px] font-semibold text-text-main leading-tight line-clamp-2">
                            Plataforma IoT con IA para Monitoreo de Consumo...
                        </h4>
                        <div className="flex items-center gap-1 py-0.2 px-1 rounded-full bg-brand/10 text-brand border border-brand/20 w-fit text-[4.5px]">
                            <span className="w-1 h-1 rounded-full bg-brand" />
                            <span>En Ejecución · IP</span>
                        </div>
                        <div className="text-[4px] text-text-dim truncate">
                            📚 IA y Aprendizaje Automático
                        </div>
                    </div>

                    <div className="space-y-1 mt-1.5">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-0.5 text-center">
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">3</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Invest.</span>
                            </div>
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">2</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Produc.</span>
                            </div>
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">2/2</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Informes</span>
                            </div>
                        </div>

                        {/* Budget Progress */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-[4px] text-text-dim">
                                <span>Ejecución</span>
                                <span className="font-bold text-text-main">71%</span>
                            </div>
                            <div className="w-full h-0.5 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-brand rounded-full" style={{ width: '71%' }} />
                            </div>
                            <div className="flex justify-between text-[3.5px] text-text-dim font-mono">
                                <span>$3.200</span>
                                <span>$4.500</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border-thin/40 pt-1 mt-1.5 flex justify-between items-center text-[4px] text-text-dim">
                        <span>📅 4/15/2026</span>
                        <span className="text-warning">⚡ TRL 5/6</span>
                        <span className="px-0.5 rounded bg-success/15 text-success border border-success/35 font-bold">85.5/100</span>
                    </div>
                </div>

                {/* Project Card 2 */}
                <div className="rounded-md border border-border-thin bg-surface p-1.5 flex flex-col justify-between hover:border-brand/40 transition-colors">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[4px] font-mono text-text-dim font-bold">
                            <span>PROY-ADM-2026-003</span>
                            <span>➔</span>
                        </div>
                        <h4 className="text-[5.5px] font-semibold text-text-main leading-tight line-clamp-2">
                            Impacto del Teletrabajo en la Productividad...
                        </h4>
                        <div className="flex items-center gap-1 py-0.2 px-1 rounded-full bg-brand/10 text-brand border border-brand/20 w-fit text-[4.5px]">
                            <span className="w-1 h-1 rounded-full bg-brand" />
                            <span>En Ejecución · Dir</span>
                        </div>
                        <div className="text-[4px] text-text-dim truncate">
                            📚 Gestión del Talento Humano
                        </div>
                    </div>

                    <div className="space-y-1 mt-1.5">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-0.5 text-center">
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">3</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Invest.</span>
                            </div>
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">1</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Produc.</span>
                            </div>
                            <div className="bg-bg-deep rounded p-0.5 border border-border-thin">
                                <span className="text-[5px] font-bold text-text-main block">0/0</span>
                                <span className="text-[3.5px] text-text-dim uppercase">Informes</span>
                            </div>
                        </div>

                        {/* Budget Progress */}
                        <div className="space-y-0.5">
                            <div className="flex justify-between text-[4px] text-text-dim">
                                <span>Ejecución</span>
                                <span className="font-bold text-text-main">67%</span>
                            </div>
                            <div className="w-full h-0.5 bg-border-thin rounded-full overflow-hidden">
                                <div className="h-full bg-brand rounded-full" style={{ width: '67%' }} />
                            </div>
                            <div className="flex justify-between text-[3.5px] text-text-dim font-mono">
                                <span>$1.200</span>
                                <span>$1.800</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border-thin/40 pt-1 mt-1.5 flex justify-between items-center text-[4px] text-text-dim">
                        <span>📅 4/15/2026</span>
                        <span className="text-warning">⚡ TRL 2/4</span>
                        <span className="px-0.5 rounded bg-success/15 text-success border border-success/35 font-bold">78/100</span>
                    </div>
                </div>
            </div>
        </>
    )
};

export const ADOPCION_CONFIG: HelpConfig = {
    icon: <Award size={24} className="text-brand" />,
    title: "Bandeja de Adopción",
    summary: "Consola para la asignación y adopción de proyectos de investigación por parte de docentes de libre distributivo.",
    description: "Espacio para que los docentes investigadores exploren propuestas de proyectos institucionales aprobadas que requieren la incorporación de un director o co-investigador para su ejecución, optimizando la asignación horaria institucional.",
    steps: [
        {
            title: "Exploración de proyectos disponibles para adopción",
            description: "Inspecciona las propuestas publicadas por la Dirección de Investigación que se alinean con tu área de conocimiento y que se encuentran pendientes de asignación de equipo técnico.",
            highlight: 'content-bottom'
        },
        {
            title: "Solicitud de adopción e ingreso de horas distributivas",
            description: "Postula para adoptar un proyecto especificando las horas que comprometerás en tu distributivo académico y cargando tu justificación de idoneidad técnica.",
            highlight: 'content-top'
        }
    ],
    compliance: "Optimiza el Criterio B.1.1 (Cuerpo Docente de Investigación) del CACES, certificando que la distribución de la carga horaria dedicada a la investigación sea eficiente, justificada y alineada al perfil académico.",
    tips: [
        "Revisa detenidamente los requisitos y entregables mínimos del proyecto antes de enviar la solicitud de adopción, ya que la asignación es vinculante.",
        "Coordina con el director de tu departamento académico para asegurar la disponibilidad de horas en tu distributivo antes de postular."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Filter Area */}
            <div className={`rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[4px] text-text-dim uppercase font-mono tracking-wider font-semibold">Distribución Horaria</span>
                        <span className="text-[7px] text-text-main font-bold">Bandeja de Adopción de Proyectos</span>
                    </div>
                </div>
                <div className="flex gap-1 text-[4.5px]">
                    <div className="flex-1 h-3.5 bg-surface-hover/20 border border-border-thin rounded px-1 flex items-center gap-1 text-text-dim">
                        🔍 <span className="truncate">Buscar propuestas elegibles...</span>
                    </div>
                </div>
            </div>

            {/* List / Table of Adoptable Projects */}
            <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                <table className="w-full text-left border-collapse text-[4.5px]">
                    <thead>
                        <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                            <th className="pb-1 font-bold">Propuesta / Área</th>
                            <th className="pb-1 font-bold">Horas / Presupuesto</th>
                            <th className="pb-1 font-bold text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin/30">
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Optimización de Redes Eléctricas</span>
                                <span className="text-[3.5px] font-mono text-text-dim font-bold bg-bg-deep px-0.5 rounded border border-border-thin/40">Dpto. Electricidad</span>
                            </td>
                            <td className="py-1 text-text-dim font-mono leading-tight">
                                <div>12 hrs/sem</div>
                                <div className="text-brand font-semibold">$3,500.00</div>
                            </td>
                            <td className="py-1 text-right">
                                <span className="px-1 py-0.5 bg-brand text-white text-[4px] rounded font-bold shadow-sm cursor-pointer">Adoptar</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Estudio de Materiales Compuestos</span>
                                <span className="text-[3.5px] font-mono text-text-dim font-bold bg-bg-deep px-0.5 rounded border border-border-thin/40">Dpto. Mecánica</span>
                            </td>
                            <td className="py-1 text-text-dim font-mono leading-tight">
                                <div>10 hrs/sem</div>
                                <div className="text-brand font-semibold">$2,800.00</div>
                            </td>
                            <td className="py-1 text-right">
                                <span className="px-1 py-0.5 bg-brand text-white text-[4px] rounded font-bold shadow-sm cursor-pointer">Adoptar</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
};

export const MONITOREO_CONFIG: HelpConfig = {
    icon: <Activity size={24} className="text-brand" />,
    title: "Monitoreo de Proyectos",
    summary: "Consola de seguimiento técnico y financiero, cronograma de entregables y carga de evidencias en tiempo real.",
    description: "Interfaz integral para supervisar la ejecución física y financiera de los proyectos de investigación activos. Permite al docente reportar avances semanales, registrar bitácoras, subir archivos de evidencias y solicitar modificaciones presupuestarias o extensiones de plazo.",
    steps: [
        {
            title: "Control del cronograma físico e hitos de actividades",
            description: "Monitorea el progreso de cada actividad planificada en tu propuesta original. Marca hitos como completados y sube los entregables correspondientes para la validación del analista de investigación.",
            highlight: 'content-top'
        },
        {
            title: "Carga de evidencias y justificación de entregables",
            description: "Sube los soportes que respaldan tus avances (informes de laboratorio, actas de encuestas, borradores de artículos). Todos los documentos son almacenados de forma segura con firma del investigador.",
            highlight: 'content-bottom'
        },
        {
            title: "Bitácora de campo y registro de egresos financieros",
            description: "Registra detalladamente las horas invertidas y los gastos ejecutados en base al presupuesto del proyecto, adjuntando facturas y justificativos de viáticos u adquisiciones de insumos.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Asegura el cumplimiento del Criterio de Control Financiero y Evaluación de Avances del CACES, justificando cuantitativa y documentalmente cada recurso y hora docente invertida en investigación.",
    tips: [
        "Sube tus evidencias inmediatamente al completar un hito para agilizar el desembolso de los siguientes tramos de financiamiento del proyecto.",
        "Usa el chat de soporte interno del proyecto para solventar dudas metodológicas directamente con el analista asignado a tu seguimiento."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Overall Monitoring Stats */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[4px] text-brand uppercase font-mono tracking-wider font-semibold">Seguimiento de Hitos</span>
                    <span className="text-[7px] text-text-main font-bold">Monitoreo de Proyecto #104</span>
                </div>
                <div className="flex gap-1.5 items-center font-mono">
                    <div className="text-right text-[4px] text-text-dim">
                        <span>Físico: 75%</span> · <span className="text-brand">Finan: 60%</span>
                    </div>
                    <div className="w-10 h-4 bg-success/10 border border-success/30 text-success rounded flex items-center justify-center text-[4px] font-bold">
                        A Tiempo
                    </div>
                </div>
            </div>

            {/* Activities Progress & Evidence Upload Panel */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left Side: Tasks Timeline */}
                <div className={`flex-[1.4] rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <span className="text-[5px] text-text-main font-bold uppercase pb-0.5 border-b border-border-thin/40">Cronograma</span>
                    <div className="space-y-1.5 py-1 overflow-y-auto">
                        <div className="flex items-center gap-1 text-[4px]">
                            <span className="text-success">●</span>
                            <div className="flex-1">
                                <span className="text-text-main font-semibold block leading-tight">Fase 1: Requisitos</span>
                                <span className="text-text-dim text-[3.5px]">Entregable aprobado</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[4px]">
                            <span className="text-brand">●</span>
                            <div className="flex-1">
                                <span className="text-text-main font-semibold block leading-tight">Fase 2: Prototipo IoT</span>
                                <span className="text-text-dim text-[3.5px]">En ejecución</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Evidence Uploader */}
                <div className={`flex-1 rounded-lg border p-1.5 flex flex-col justify-between border-dashed transition-all duration-300 min-h-0 ${highlightBottomClass}`}>
                    <div className="flex flex-col gap-1 items-center justify-center py-2 flex-1 border border-dashed border-border-thin/60 rounded bg-surface-hover/10">
                        <span className="text-brand text-xs font-bold">+</span>
                        <span className="text-[4.5px] font-semibold text-text-main uppercase tracking-wider leading-none">Cargar Evidencia</span>
                        <span className="text-[3px] text-text-dim">PDF / ZIP</span>
                    </div>
                    <div className="border-t border-border-thin/40 pt-1 mt-1 text-[3.5px] flex justify-between text-text-dim">
                        <span>Límite: 25MB</span>
                        <span className="text-brand font-bold cursor-pointer">Historial</span>
                    </div>
                </div>
            </div>
        </>
    )
};

export const INFORMES_AVANCE_CONFIG: HelpConfig = {
    icon: <BookOpen size={24} className="text-brand" />,
    title: "Bandeja de Informes de Avance",
    summary: "Consola de revisión y validación de informes técnicos y financieros periódicos de proyectos activos.",
    description: "Espacio centralizado donde la Dirección de Investigación y los analistas técnicos revisan, aprueban o devuelven los informes parciales presentados por los directores de proyectos para asegurar el cumplimiento del cronograma.",
    steps: [
        {
            title: "Revisión técnica de informes e hitos declarados",
            description: "Examina la documentación y evidencias cargadas por los investigadores para cada hito del cronograma del proyecto. Valida si la calidad y formato del entregable cumple con los estándares exigidos.",
            highlight: 'content-bottom'
        },
        {
            title: "Gestión de observaciones y re-envíos",
            description: "En caso de inconsistencias técnicas o falta de evidencias, emite observaciones detalladas y devuelve el informe al docente, estableciendo un plazo de subsanación automatizado.",
            highlight: 'content-top'
        }
    ],
    compliance: "Respalda los procesos de auditoría y control de calidad académica requeridos en los modelos de acreditación institucional del CACES, certificando la supervisión formal de los recursos públicos.",
    tips: [
        "Sé específico en tus observaciones textuales para que el docente sepa exactamente qué corregir y se eviten múltiples iteraciones de devolución.",
        "Utiliza los filtros de fecha de vencimiento para dar prioridad a la revisión de informes cuyos plazos de desembolso estén próximos."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Controls */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[4px] text-text-dim uppercase font-mono tracking-wider font-semibold">Revisión de Entregables</span>
                    <span className="text-[7px] text-text-main font-bold">Bandeja de Informes de Avance</span>
                </div>
                <div className="flex gap-1 text-[4.5px]">
                    <div className="w-16 h-4 bg-surface-hover/20 border border-border-thin rounded px-1 flex items-center justify-between text-text-dim">
                        <span>Todos los periodos</span>
                        <span>▼</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                <table className="w-full text-left border-collapse text-[4.5px]">
                    <thead>
                        <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                            <th className="pb-1 font-bold">Informe / Proyecto</th>
                            <th className="pb-1 font-bold">Investigador</th>
                            <th className="pb-1 font-bold text-center">Estado</th>
                            <th className="pb-1 font-bold text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-thin/30">
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Informe Hito 2 - IA IoT</span>
                                <span className="text-[3.5px] font-mono text-text-dim">PROY-SOFT-2026-001</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main block leading-tight">Dr. Carlos Mendoza</span>
                                <span className="text-[3.5px] text-text-dim">Dpto. Sistemas</span>
                            </td>
                            <td className="py-1 text-center">
                                <span className="px-1 py-0.2 bg-warning/15 border border-warning/35 text-warning rounded-[2px] text-[3.5px] font-semibold">
                                    En Revisión
                                </span>
                            </td>
                            <td className="py-1 text-right">
                                <span className="px-1 py-0.5 bg-brand text-white text-[4px] rounded font-bold cursor-pointer">Detalles</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-surface/30">
                            <td className="py-1">
                                <span className="text-text-main font-semibold block leading-tight">Informe Hito 1 - Teletrabajo</span>
                                <span className="text-[3.5px] font-mono text-text-dim">PROY-ADM-2026-003</span>
                            </td>
                            <td className="py-1">
                                <span className="text-text-main block leading-tight">Mgs. Juan Pérez</span>
                                <span className="text-[3.5px] text-text-dim">Dpto. Administración</span>
                            </td>
                            <td className="py-1 text-center">
                                <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded-[2px] text-[3.5px] font-semibold">
                                    Aprobado
                                </span>
                            </td>
                            <td className="py-1 text-right">
                                <span className="px-1 py-0.5 bg-text-main/10 border border-border-thin text-text-main rounded text-[4px] font-bold cursor-pointer">Revisar</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
};
