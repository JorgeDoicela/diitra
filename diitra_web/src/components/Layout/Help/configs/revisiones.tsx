import { Scale } from 'lucide-react';
import type { HelpConfig, MockupProps } from '../types';

export const REVISIONES_CONFIG: HelpConfig = {
    icon: <Scale size={24} className="text-brand" />,
    title: "Consola de Revisores Pares",
    summary: "Entorno de evaluación ciega para revisores pares internos y externos de propuestas científicas.",
    description: "Plataforma de trabajo especializada para revisores pares académicos, diseñada para realizar la evaluación doble ciego de propuestas de investigación. Asegura la total confidencialidad de la identidad de los proponentes y proporciona una rúbrica estructurada de calificación y herramientas para el registro de retroalimentación verbal por audio.",
    steps: [
        {
            title: "Buzón de expedientes asignados en doble ciego",
            description: "Revisa la lista de propuestas asignadas a tu perfil de revisor. Al abrir cualquier propuesta, accederás a la documentación anonimizada (resumen, metodología, presupuesto). La información del docente autor se mantiene oculta para garantizar la imparcialidad del dictamen.",
            highlight: 'content-bottom'
        },
        {
            title: "Evaluación paramétrica por rúbrica CACES",
            description: "Califica de manera individual cada uno de los criterios obligatorios definidos en la rúbrica oficial (Relevancia Científica, Coherencia Metodológica, Viabilidad Presupuestaria, Pertinencia Social). Selecciona la puntuación correspondiente de la escala de evaluación del sistema.",
            highlight: 'content-bottom'
        },
        {
            title: "Dictamen final y grabadora de audio integrada",
            description: "Establece tu dictamen final ('Aprobado', 'Devuelto con Observaciones' o 'Rechazado'). Puedes grabar un comentario de audio de hasta 3 minutos utilizando la grabadora de voz integrada del sistema, lo que brindará una retroalimentación detallada y humana al docente investigador.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Garantiza la aplicación estricta del estándar del CACES sobre evaluación por pares externos bajo la metodología doble ciego, documentando la idoneidad académica del tribunal evaluador y la rigurosidad de los procesos de arbitraje institucional.",
    tips: [
        "El sistema guarda borradores parciales de tu evaluación para que puedas interrumpir y retomar tu trabajo en cualquier momento sin perder la información ingresada.",
        "Recuerda que tus audios de retroalimentación son distorsionados levemente de forma digital por el sistema para evitar la identificación de la voz del revisor por parte del docente."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Controls Area */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[4px] text-brand uppercase font-mono tracking-wider font-semibold">Evaluación por Pares</span>
                    <span className="text-[7px] text-text-main font-bold">Mis Revisiones</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-12 h-4 bg-surface-hover border border-border-thin rounded flex items-center justify-center text-[4px] text-text-dim">Actualizar</div>
                    <div className="w-16 h-4 bg-success/15 border border-success/35 text-success rounded flex items-center justify-center text-[4px] font-bold">Avance: 66%</div>
                </div>
            </div>

            {/* Main Content Layout: 2 Columns */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left Column - List of Reviews */}
                <div className={`flex-[2.8] rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <span className="text-[5px] text-warning font-bold">⚠ Pendientes de Evaluación (1)</span>
                    <div className="rounded border border-border-thin bg-surface p-1 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[3.5px]">
                                <span className="px-0.5 bg-bg-deep border border-border-thin text-text-dim rounded">#104</span>
                                <span className="px-0.5 bg-warning/10 border border-warning/30 text-warning rounded-sm">Pendiente</span>
                            </div>
                            <span className="text-[5px] font-semibold text-text-main block truncate max-w-[120px]">Plataforma IoT con Inteligencia Artificial...</span>
                            <span className="text-[3.5px] text-error font-mono">📅 Vence en 3 días</span>
                        </div>
                        <div className="px-1 py-0.5 bg-brand text-white text-[4px] rounded font-bold">Evaluar</div>
                    </div>

                    <span className="text-[5px] text-success font-bold mt-1">✓ Completadas (1)</span>
                    <div className="rounded border border-border-thin bg-surface/60 p-1 flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[3.5px]">
                                <span className="px-0.5 bg-bg-deep border border-border-thin text-text-dim rounded">#101</span>
                                <span className="px-0.5 bg-success/10 border border-success/30 text-success rounded-sm">Completada</span>
                            </div>
                            <span className="text-[5px] font-semibold text-text-main block truncate max-w-[120px] opacity-70">Sistema de Alertas Meteorológicas...</span>
                            <span className="text-[3.5px] text-text-dim font-mono">⭐ Calificación: 88.0/100</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats Card */}
                <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 bg-surface-hover/10 ${highlightBottomClass}`}>
                    <span className="text-[4px] font-semibold text-text-main">Resumen</span>
                    <div className="space-y-1">
                        <div className="bg-bg-deep rounded p-1 flex justify-between text-[4px]">
                            <span className="text-text-dim">Pendientes</span>
                            <span className="text-text-main font-bold">1</span>
                        </div>
                        <div className="bg-bg-deep rounded p-1 flex justify-between text-[4px]">
                            <span className="text-text-dim">Completadas</span>
                            <span className="text-text-main font-bold">1</span>
                        </div>
                        <div className="bg-bg-deep rounded p-1 flex justify-between text-[4px]">
                            <span className="text-text-dim">Vencidas</span>
                            <span className="text-text-main font-bold">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const EVALUACION_CONFIG: HelpConfig = {
    ...REVISIONES_CONFIG,
    title: "Rúbrica de Evaluación",
    summary: "Interface estructurada para la calificación paramétrica, justificación de puntajes y dictamen de propuestas.",
    description: "Formulario dinámico de evaluación doble ciego donde el revisor par califica individualmente cada criterio obligatorio de la propuesta de investigación, proporcionando retroalimentación de valor y un veredicto formal.",
    steps: [
        {
            title: "Calificación de criterios y ponderaciones obligatorias",
            description: "Evalúa la pertinencia, justificación, metodología y plan de egresos de la propuesta seleccionando los puntajes específicos de las escalas descriptivas.",
            highlight: 'content-bottom'
        },
        {
            title: "Ingreso de justificaciones cualitativas por criterio",
            description: "Transcribe una justificación analítica obligatoria para cada puntuación asignada, brindando argumentos de sustento científico para el proponente.",
            highlight: 'content-bottom'
        },
        {
            title: "Dictamen final y firma electrónica del veredicto",
            description: "Selecciona el veredicto definitivo (Aprobado, Pendiente de Correcciones o Rechazado) y firma el reporte digitalmente para integrarlo al expediente del proyecto.",
            highlight: 'content-top'
        }
    ],
    compliance: "Cumple rigurosamente con los estándares internacionales de arbitraje científico y las exigencias de transparencia e idoneidad metodológica evaluadas en los modelos del CACES.",
    tips: [
        "Tus valoraciones deben ser objetivas y constructivas; recuerda que el autor recibirá tus comentarios de forma totalmente anónima.",
        "El sistema guardará automáticamente tus avances; puedes suspender la evaluación y completarla en otro momento del día."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Overall Score Summary */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex items-center gap-1.5">
                    <span className="text-text-dim text-[5px]">⬅ Volver</span>
                    <div className="w-[1px] h-2.5 bg-border-thin" />
                    <span className="text-[6px] font-semibold text-text-main">Rúbrica de Evaluación</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded text-[4.5px] font-semibold">APROBADO</div>
                    <span className="text-[7px] font-bold text-text-main font-mono">88.5/100</span>
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left side: Protocol Document Viewer */}
                <div className="flex-[1.2] rounded-lg border border-border-thin bg-surface p-2 flex flex-col gap-1.5 overflow-hidden">
                    <div className="border-b border-border-thin/40 pb-1 text-center">
                        <span className="text-[3.5px] text-text-dim uppercase tracking-wider block">Traversari · DIITRA</span>
                        <span className="text-[4.5px] font-bold text-text-main leading-tight">PROTOCOLO DE INVESTIGACIÓN</span>
                    </div>
                    <div className="space-y-1 flex-1 overflow-hidden opacity-60">
                        <div className="w-2/3 h-1.5 bg-text-main/20 rounded" />
                        <div className="w-full h-1 bg-text-dim/10 rounded" />
                        <div className="w-11/12 h-1 bg-text-dim/10 rounded" />
                    </div>
                </div>

                {/* Right side: Rubric Form */}
                <div className={`flex-1 rounded-lg border p-1.5 flex flex-col justify-between transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <div className="space-y-1.5 overflow-y-auto pr-0.5">
                        <span className="text-[4px] text-text-dim uppercase tracking-wider block">Criterios de Evaluación</span>
                        {/* Criterion Card */}
                        <div className="border border-border-thin rounded p-1 space-y-1 bg-surface-hover/20">
                            <div className="flex justify-between text-[4.5px] font-semibold text-text-main">
                                <span>1. Pertinencia Científica</span>
                                <span className="text-brand">22/25 pts</span>
                            </div>
                            <div className="w-full h-0.5 bg-border-thin rounded-full">
                                <div className="h-full bg-brand rounded-full" style={{ width: '88%' }} />
                            </div>
                        </div>
                        <div className="border border-border-thin rounded p-1 space-y-1 bg-surface-hover/20">
                            <div className="flex justify-between text-[4.5px] font-semibold text-text-main">
                                <span>2. Coherencia Metodológica</span>
                                <span className="text-brand">20/25 pts</span>
                            </div>
                            <div className="w-full h-0.5 bg-border-thin rounded-full">
                                <div className="h-full bg-brand rounded-full" style={{ width: '80%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="border-t border-border-thin/40 pt-1 mt-1 flex justify-between items-center shrink-0">
                        <span className="text-[4px] text-success">✔ Guardado</span>
                        <div className="px-1 py-0.5 bg-brand text-white text-[4px] rounded font-bold">Enviar</div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const ARBITRAJE_CONFIG: HelpConfig = {
    icon: <Scale size={24} className="text-brand" />,
    title: "Módulo de Arbitraje y Resolución",
    summary: "Espacio administrativo para dirimir evaluaciones de proyectos discordantes o en apelación.",
    description: "Sección de arbitraje utilizada por el comité científico de investigación de la institución para dirimir evaluaciones con resultados divergentes (por ejemplo, un revisor aprueba y otro rechaza una propuesta). El comité utiliza esta herramienta para revisar los dictámenes, oír la retroalimentación y emitir una resolución definitiva.",
    steps: [
        {
            title: "Comparación de dictámenes discrepantes",
            description: "Examina los dictámenes conflictivos mostrados en columnas paralelas en la pantalla de arbitraje. Podrás ver los comentarios específicos del evaluador 1 y del evaluador 2, sus calificaciones numéricas por criterios y reproducir los comentarios de audio para evaluar las divergencias técnicas.",
            highlight: 'content-bottom'
        },
        {
            title: "Resolución del comité y carga de actas",
            description: "Registra la decisión definitiva del comité (Aprobación Definitiva, Correcciones Mayores con Nuevo Revisor o Rechazo Permanente). Es obligatorio transcribir el acta de resolución del comité, ingresar el código de la sesión plenaria del consejo científico y adjuntar el acta escaneada debidamente firmada.",
            highlight: 'content-bottom'
        },
        {
            title: "Firma electrónica de resolución y auto-notificación",
            description: "Estampa tu firma digital en el acta de arbitraje. Al completar el firmado, DIITRA actualizará el expediente general del proyecto en tiempo real, generará los certificados de aprobación si aplica y enviará una notificación con el dictamen de arbitraje al docente investigador.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Asegura el debido proceso y la transparencia institucional en las fases de dictaminación científica, mitigando conflictos de interés en procesos de asignación de financiamiento público evaluados bajo estándares del CACES.",
    tips: [
        "Puedes convocar a un tercer revisor dirimente ('Evaluador Ciego 3') desde la misma consola en caso de que el comité científico requiera un dictamen técnico adicional.",
        "Todas las resoluciones de arbitraje quedan grabadas con sellos de tiempo inmutables en la bitácora de auditoría forense para fines de auditoría externa."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header / Top Content */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[4px] text-brand uppercase font-mono tracking-wider font-semibold">Módulo de Arbitraje</span>
                    <span className="text-[7px] text-text-main font-bold">Gestión de Arbitraje</span>
                </div>
                <div className="flex gap-1">
                    <div className="px-1.5 py-0.5 bg-surface-hover border border-border-thin rounded text-[4.5px] font-bold">
                        + Árbitro Externo
                    </div>
                </div>
            </div>

            {/* Layout: 2 Columns */}
            <div className="flex-1 flex gap-1.5 min-h-0">
                {/* Left: Projects Table */}
                <div className={`flex-[2.8] rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                    <table className="w-full text-left border-collapse text-[4.5px]">
                        <thead>
                            <tr className="border-b border-border-thin/60 text-[3.5px] font-mono text-text-dim uppercase tracking-wider">
                                <th className="pb-1 font-bold">Proyecto</th>
                                <th className="pb-1 font-bold">Árbitros</th>
                                <th className="pb-1 font-bold">Estado</th>
                                <th className="pb-1 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin/30">
                            <tr className="bg-surface-hover/10">
                                <td className="py-1">
                                    <span className="text-text-main font-semibold block leading-tight truncate max-w-[100px]">Plataforma IoT con IA...</span>
                                    <span className="text-[3px] text-warning border border-warning/30 rounded px-0.5 font-semibold">Sin externo</span>
                                </td>
                                <td className="py-1 font-mono text-center">1/2</td>
                                <td className="py-1">
                                    <span className="px-0.5 bg-warning/15 text-warning border border-warning/30 rounded text-[3.5px]">En Proceso</span>
                                </td>
                                <td className="py-1 text-right text-brand">⚙</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Right: Metrics & Alerts */}
                <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1.5 transition-all duration-300 bg-surface-hover/10 ${highlightBottomClass}`}>
                    <span className="text-[4px] font-semibold text-text-main">Métricas CACES</span>
                    <div className="space-y-0.5 font-semibold">
                        <div className="bg-bg-deep rounded p-0.5 text-[3.5px] flex justify-between">
                            <span className="text-text-dim">Tasa Aprob.</span>
                            <span className="text-success font-bold">75%</span>
                        </div>
                        <div className="bg-bg-deep rounded p-0.5 text-[3.5px] flex justify-between">
                            <span className="text-text-dim">Pares Ext.</span>
                            <span className="text-brand font-bold">50%</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const ARBITRAJE_PROYECTO_CONFIG: HelpConfig = {
    icon: <Scale size={24} className="text-brand" />,
    title: "Arbitraje de Proyecto",
    summary: "Panel del Comité Científico para la resolución de evaluaciones divergentes y emisión de dictamen final.",
    description: "Entorno operativo del Consejo de Investigación diseñado para analizar discrepancias en los dictámenes de revisores pares y emitir una resolución definitiva que dirima la postulación.",
    steps: [
        {
            title: "Visor comparativo de dictámenes de pares",
            description: "Analiza de forma paralela los puntajes, comentarios específicos y audios de los revisores que intervinieron en la evaluación de la propuesta en conflicto.",
            highlight: 'content-bottom'
        },
        {
            title: "Debate, resolución de consenso y carga de acta",
            description: "Registra la decisión definitiva del consejo, adjuntando el acta de sesión respectiva y transcribiendo los fundamentos del fallo que se comunicarán al docente.",
            highlight: 'content-bottom'
        },
        {
            title: "Emisión de resolución definitiva firmada",
            description: "Genera y suscribe digitalmente la resolución oficial de arbitraje, la cual causará estado y actualizará de inmediato el flujo del proyecto en DIITRA.",
            highlight: 'content-top'
        }
    ],
    compliance: "Garantiza el debido proceso y la seguridad jurídica en la asignación de recursos competitivos de investigación, de acuerdo a la normativa nacional y el modelo de evaluación del CACES.",
    tips: [
        "Puedes solicitar una tercera evaluación dirimente antes de emitir el fallo si el comité considera que el tema requiere especialidad técnica adicional.",
        "Todas las actas de arbitraje quedan respaldadas en la base de datos inmutable para resguardo de la institución."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            {/* Header & Status Banner */}
            <div className={`rounded-lg border p-1.5 flex justify-between items-center transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="flex items-center gap-1.5">
                    <span className="text-text-dim text-[5px]">⬅ Volver</span>
                    <div className="w-[1px] h-2.5 bg-border-thin" />
                    <span className="text-[6px] font-semibold text-text-main font-bold">Arbitraje del Proyecto</span>
                </div>
                <div className="flex gap-1">
                    <div className="px-1.5 py-0.5 bg-brand text-white rounded text-[4.5px] font-bold">
                        Cerrar Arbitraje
                    </div>
                </div>
            </div>

            {/* Split review status columns */}
            <div className={`flex-1 rounded-lg border p-1.5 grid grid-cols-2 gap-1.5 transition-all duration-300 min-h-0 overflow-hidden ${highlightBottomClass}`}>
                {/* Column 1: Internos */}
                <div className="rounded border border-border-thin bg-surface p-1 flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[4.5px] font-bold text-text-main uppercase block border-b border-border-thin/40 pb-0.5">Árbitros Internos</span>
                        <div className="flex justify-between items-center text-[4px] bg-bg-deep p-0.5 rounded">
                            <span className="font-semibold text-text-main">Dr. Juan Pérez</span>
                            <span className="text-success font-mono font-bold">75.0/100</span>
                        </div>
                    </div>
                    <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded text-[3.5px] font-semibold w-fit">COMPLETADA</span>
                </div>

                {/* Column 2: Externos */}
                <div className="rounded border border-border-thin bg-surface p-1 flex flex-col justify-between">
                    <div className="space-y-1">
                        <span className="text-[4.5px] font-bold text-text-main uppercase block border-b border-border-thin/40 pb-0.5">Árbitros Externos</span>
                        <div className="flex justify-between items-center text-[4px] bg-bg-deep p-0.5 rounded">
                            <span className="font-semibold text-text-main">Mgs. Ana Gómez</span>
                            <span className="text-error font-mono font-bold">50.0/100</span>
                        </div>
                    </div>
                    <span className="px-1 py-0.2 bg-success/15 border border-success/35 text-success rounded text-[3.5px] font-semibold w-fit">COMPLETADA</span>
                </div>
            </div>
        </>
    )
};
