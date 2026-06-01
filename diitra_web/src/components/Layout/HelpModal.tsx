import React, { useState, useEffect } from 'react';
import { 
    X, BookOpen, Activity, Shield, History, 
    Settings2, BarChart3, Bell, ShieldCheck, PenTool, Scale,
    Award, Zap, ChevronLeft, ChevronRight, Check
} from 'lucide-react';

interface HelpStep {
    title: string;
    description: string;
}

interface HelpConfig {
    icon: React.ReactNode;
    title: string;
    summary: string;
    description: string;
    steps: HelpStep[];
    compliance: string;
    tips: string[];
}

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    pathname: string;
}

const DEFAULT_CONFIG: HelpConfig = {
    icon: <Settings2 size={24} className="text-brand" />,
    title: "Módulo del Sistema",
    summary: "Sección de configuración y visualización general de DIITRA.",
    description: "Este módulo te permite interactuar con los procesos y herramientas del sistema de investigación institucional.",
    steps: [
        {
            title: "Navegación general",
            description: "Utiliza el panel lateral izquierdo para moverte entre los diferentes módulos disponibles según tu rol institucional."
        },
        {
            title: "Ayuda contextual",
            description: "Puedes abrir esta guía en cualquier momento para obtener información específica del módulo que estás visualizando."
        }
    ],
    compliance: "Alineado con los estándares del Modelo de Evaluación del CACES para asegurar la calidad académica.",
    tips: [
        "Usa el atajo rápido para buscar en todo el sistema presionando 'Buscar' en la barra lateral.",
        "Cambia entre modo claro y oscuro desde el panel de perfil en la esquina inferior izquierda."
    ]
};

const HELP_MAP: Record<string, HelpConfig> = {
    '/dashboard': {
        icon: <Activity size={24} className="text-brand animate-pulse" />,
        title: "Panel de Control",
        summary: "Visualización en tiempo real de indicadores y accesos directos de tu perfil de investigación.",
        description: "El panel principal centraliza el estado global de tus investigaciones y del cumplimiento del instituto, permitiéndote tomar acciones inmediatas y revisar tus pendientes.",
        steps: [
            {
                title: "Monitoreo de KPIs",
                description: "Revisa las tarjetas de estadísticas superiores para ver tus proyectos aprobados, productos académicos y presupuesto ejecutado."
            },
            {
                title: "Accesos rápidos y directos",
                description: "Accede con un solo clic a la creación de proyectos, informe final o historial desde las tarjetas bento."
            },
            {
                title: "Rol institucional y capacidades",
                description: "Verifica tu rol activo e instituto asignado en la cabecera. Los docentes pueden ver sus horas asignadas a investigación."
            }
        ],
        compliance: "Registra en tiempo real los indicadores de vinculación del cuerpo académico con la investigación, exigido por el CACES.",
        tips: [
            "Si eres docente, asegúrate de que tu carga de horas de investigación esté correctamente sincronizada desde el SIGAFI.",
            "Utiliza el buscador superior para buscar proyectos por código institucional rápidamente."
        ]
    },
    '/investigacion': {
        icon: <PenTool size={24} className="text-brand" />,
        title: "Proyectos de I+D+i",
        summary: "Consola de creación y administración de protocolos de investigación y desarrollo.",
        description: "Espacio diseñado para formular nuevas propuestas, dar seguimiento a borradores y coordinar los resultados formales de los proyectos de desarrollo tecnológico del instituto.",
        steps: [
            {
                title: "Creación de propuestas (Postulación)",
                description: "Usa el botón 'Nueva Postulación' para iniciar el asistente de registro de proyecto. Define el título, resumen, presupuesto e investigadores."
            },
            {
                title: "Buzón de Documentos",
                description: "Revisa el historial de documentos generados por el núcleo del sistema, incluyendo contratos y resoluciones asociadas."
            },
            {
                title: "Lanzador de Informe Final",
                description: "Al culminar un proyecto, usa esta herramienta para compilar y enviar los resultados de tu investigación al comité evaluador."
            }
        ],
        compliance: "Garantiza la formalización institucional de proyectos con pertinencia social y tecnológica bajo rúbricas acreditables ante el CACES.",
        tips: [
            "Antes de postular, descarga y lee detenidamente las bases de la convocatoria correspondiente en el módulo de Convocatorias.",
            "Puedes asociar alumnos colaboradores para potenciar el indicador de semilleros académicos."
        ]
    },
    '/investigacion/mis-proyectos': {
        icon: <BookOpen size={24} className="text-brand" />,
        title: "Mis Proyectos",
        summary: "Expediente personal y seguimiento de tus postulaciones e investigaciones activas.",
        description: "Visualiza de forma detallada el progreso de tus postulaciones a convocatorias. Puedes editar borradores, revisar observaciones de revisores y acceder a tu espacio de trabajo.",
        steps: [
            {
                title: "Estados del Proyecto",
                description: "Sigue el ciclo de vida: Borrador (editable), Enviado (bajo revisión), En Ejecución (aprobado y activo), y Finalizado."
            },
            {
                title: "Workspace Colaborativo",
                description: "Haz clic en cualquier proyecto para abrir el espacio de trabajo en tiempo real, donde redactarás y subirás los entregables con tu equipo."
            },
            {
                title: "Eliminación de borradores",
                description: "Puedes descartar propuestas en estado 'Borrador' si deseas iniciar una nueva postulación desde cero."
            }
        ],
        compliance: "Estándar CES de seguimiento e informes de avance inmutables para el control de la carga horaria dedicada a la investigación.",
        tips: [
            "Si tu propuesta es rechazada o devuelta con observaciones, verás una alerta amarilla con los comentarios de los evaluadores.",
            "Mantén actualizados los entregables de tu cronograma para evitar retrasos en el informe de monitoreo."
        ]
    },
    '/usuarios': {
        icon: <Shield size={24} className="text-brand" />,
        title: "Gestión de Usuarios",
        summary: "Control administrativo de acceso, roles y perfiles del personal académico.",
        description: "Sección exclusiva de administración central para gestionar la asignación de permisos de docentes, alumnos y registrar evaluadores pares externos del sistema.",
        steps: [
            {
                title: "Asignación rápida de roles",
                description: "Activa o desactiva capacidades específicas de usuario (como Revisor o Administrador) mediante los selectores interactivos de la tabla."
            },
            {
                title: "Registro de evaluadores externos",
                description: "Usa el botón 'Nuevo Externo' para registrar perfiles de otras universidades, ingresando su cédula, especialidad académica y código ORCID."
            },
            {
                title: "Inspección de perfiles",
                description: "Haz clic en cualquier fila de la tabla para abrir el panel lateral con la metadata extendida, incluyendo su firma electrónica habilitada."
            }
        ],
        compliance: "Asegura la transparencia y la idoneidad docente en los procesos de auditoría del CACES mediante perfiles académicos validados.",
        tips: [
            "Recuerda que al registrar un evaluador externo, el sistema le genera credenciales de acceso convencionales por defecto.",
            "Filtra la lista por 'Externos' para gestionar únicamente al tribunal evaluador interinstitucional."
        ]
    },
    '/auditoria': {
        icon: <History size={24} className="text-brand" />,
        title: "Auditoría Forense",
        summary: "Bitácora inmutable de trazabilidad de acciones críticas en la base de datos.",
        description: "Módulo forense diseñado para rastrear qué usuario realizó qué cambio, cuándo y desde dónde, asegurando la inmutabilidad de la información institucional.",
        steps: [
            {
                title: "Búsqueda y filtros avanzados",
                description: "Filtra la lista de transacciones por palabra clave, módulo administrativo, acción específica o rango de fechas."
            },
            {
                title: "Visualización de diferencias (Diff)",
                description: "Haz clic en cualquier registro para abrir la vista forense. Compara los datos del registro 'Antes' y 'Después' en un formato visual estructurado."
            },
            {
                title: "Exportación XLSX certificada",
                description: "Usa el botón 'Exportar Reporte' para generar un archivo Excel con todas las columnas técnicas (IP, User Agent, etc.) para auditorías externas."
            }
        ],
        compliance: "Cumple con el estándar de inmutabilidad y seguridad de la información del CACES, certificando las actas de arbitraje y dictámenes.",
        tips: [
            "El panel forense te permite copiar directamente los fragmentos JSON del estado de los registros en caso de requerir soporte técnico.",
            "Usa la pestaña 'Campos sin cambios' en el inspector para revisar el registro completo original."
        ]
    },
    '/configuracion': {
        icon: <Settings2 size={24} className="text-brand" />,
        title: "Configuración del Sistema",
        summary: "Mantenimiento de parámetros globales, catálogos e indicadores del DIITRA.",
        description: "Consola de administración para catalogar dominios, líneas de investigación institucionales, períodos académicos, tipos de productos y metas del CACES.",
        steps: [
            {
                title: "Gestión de Líneas y Dominios",
                description: "Crea y edita las líneas de investigación oficiales del ISTPET a las que deben alinearse obligatoriamente todos los proyectos."
            },
            {
                title: "Períodos y productos académicos",
                description: "Abre o cierra semestres de investigación. Configura los tipos de entregables (como artículos o ponencias) y si requieren indexación."
            },
            {
                title: "Metas CACES",
                description: "Configura el año de normativa e introduce los valores mínimos de referencia nacionales requeridos para acreditar el indicador."
            }
        ],
        compliance: "Define los catálogos normativos requeridos por SENESCYT y CES para clasificar correctamente la producción científica y tecnológica.",
        tips: [
            "Si desactivas una línea de investigación, los proyectos vigentes seguirán usándola pero no se podrá seleccionar para nuevas postulaciones.",
            "Asegúrate de configurar correctamente la fecha de cierre de los períodos académicos para automatizar las alertas."
        ]
    },
    '/analiticas': {
        icon: <BarChart3 size={24} className="text-brand" />,
        title: "Analíticas de Investigación",
        summary: "Cuadro de mando directivo con indicadores predictivos de acreditación.",
        description: "Permite a los directivos evaluar el avance de los indicadores CACES del instituto en tiempo real, proyectando si se cumplirán las metas anuales.",
        steps: [
            {
                title: "Variables de corte",
                description: "Filtra todas las métricas bento por periodo académico o por tecnología/carrera para evaluar el rendimiento de áreas específicas."
            },
            {
                title: "Pestaña de Cumplimiento CACES",
                description: "Compara el porcentaje de cumplimiento real versus la meta nacional para el claustro docente y producción indexada."
            },
            {
                title: "Reporte PDF institucional",
                description: "Usa el botón 'Exportar PDF' para descargar el dossier ejecutivo formateado listo para presentar ante el comité directivo."
            }
        ],
        compliance: "Instrumento directo para la justificación del indicador cuantitativo de investigación en las fases de evaluación externa del CACES.",
        tips: [
            "Haz clic en los segmentos del gráfico de donut de estado de proyectos para filtrar rápidamente la tabla de proyectos asociada.",
            "Utiliza el botón de actualización en tiempo real para sincronizar las métricas con las últimas actas aprobadas."
        ]
    },
    '/notificaciones': {
        icon: <Bell size={24} className="text-brand" />,
        title: "Centro de Notificaciones",
        summary: "Bandeja de notificaciones y alertas contextuales del sistema.",
        description: "Monitorea comunicados, solicitudes de revisión académica por pares, alertas de finalización de plazos y firmas de actas institucionales.",
        steps: [
            {
                title: "Filtros temáticos",
                description: "Navega entre las pestañas 'Sin leer', 'Urgente', 'Investigación' y 'Sistema' para priorizar tus acciones."
            },
            {
                title: "Acción en bloque",
                description: "Marca todas las alertas pendientes como leídas simultáneamente para mantener limpia tu bandeja principal."
            },
            {
                title: "Enlaces contextuales rápidos",
                description: "Haz clic en el cuerpo de cualquier notificación para ir directamente a la vista o documento específico asociado."
            }
        ],
        compliance: "Garantiza la trazabilidad y la notificación formal oportuna de actos administrativos requeridos por la normativa de régimen académico.",
        tips: [
            "Las alertas de categoría 'Urgente' contienen plazos de firmas electrónicas de actas que no debes ignorar.",
            "Recuerda que también recibes una notificación resumida en la campanilla de tu perfil en la barra lateral."
        ]
    },
    '/verify': {
        icon: <ShieldCheck size={24} className="text-brand" />,
        title: "Verificación Documental",
        summary: "Validación criptográfica de autenticidad e inmutabilidad de certificados.",
        description: "Herramienta pública para verificar la autenticidad de cualquier reporte, resolución o acta generada por el sistema DIITRA mediante su hash SHA-256.",
        steps: [
            {
                title: "Verificación por código",
                description: "Introduce el código alfanumérico impreso en el documento para iniciar la validación en la base de datos central."
            },
            {
                title: "Verificación QR automatizada",
                description: "Escanea el código QR del documento físico con tu teléfono para abrir el enlace directo que realiza la verificación de forma transparente."
            },
            {
                title: "Dictamen de autenticidad",
                description: "Verifica si el documento está 'VIGENTE', los firmantes autorizados que estamparon su firma digital y la fecha de inmutabilidad en el servidor."
            }
        ],
        compliance: "Cumple con las directrices de la LOPDP y normativas del CES sobre validez documental de actas de titulación y de investigación.",
        tips: [
            "Esta herramienta no requiere inicio de sesión y está disponible públicamente para validaciones de entidades de control externas.",
            "Si el hash no coincide con ningún registro, el sistema te alertará de que el documento no es auténtico."
        ]
    },
    '/revisiones': {
        icon: <Scale size={24} className="text-brand" />,
        title: "Revisiones por Pares",
        summary: "Consola de evaluación de proyectos para revisores internos y externos.",
        description: "Permite a los revisores calificar los protocolos de investigación asignados bajo la metodología doble ciego, garantizando imparcialidad.",
        steps: [
            {
                title: "Proyectos asignados",
                description: "Visualiza la lista de proyectos en estado 'En Revisión'. Accede a los detalles anonimizados del investigador."
            },
            {
                title: "Evaluación rúbrica paso a paso",
                description: "Califica cada criterio normado (metodología, viabilidad, coherencia) asignando puntajes según el reglamento del ISTPET."
            },
            {
                title: "Dictamen y retroalimentación de audio",
                description: "Emite tu dictamen final y graba comentarios verbales usando la grabadora de audio integrada para guiar al docente."
            }
        ],
        compliance: "Cumple con el criterio CACES de evaluación por pares externos doble ciego de la producción científica y proyectos institucionales.",
        tips: [
            "Asegúrate de guardar tus cambios frecuentemente si estás realizando una evaluación extensa para evitar pérdida de datos.",
            "Recuerda que tu identidad se mantiene oculta para el proponente en todo momento."
        ]
    },
    '/arbitraje': {
        icon: <Scale size={24} className="text-brand" />,
        title: "Consola de Arbitraje",
        summary: "Módulo administrativo para dirimir evaluaciones de proyectos discordantes.",
        description: "En caso de discrepancias mayores entre las calificaciones de los revisores, el comité utiliza este panel para emitir la resolución final aprobatoria o denegatoria.",
        steps: [
            {
                title: "Inspección de discrepancias",
                description: "Compara en columnas paralelas el puntaje y las observaciones cualitativas provistas por los revisores del proyecto."
            },
            {
                title: "Resolución del comité",
                description: "Introduce los datos de la resolución oficial del comité institucional y aprueba o rechaza definitivamente la propuesta."
            },
            {
                title: "Notificación automatizada",
                description: "El sistema actualizará el expediente del docente y enviará las actas definitivas firmadas al proponente de forma automática."
            }
        ],
        compliance: "Garantiza el debido proceso y la imparcialidad del dictamen de evaluación bajo estándares de control y auditoría interna.",
        tips: [
            "Puedes acceder a los audios explicativos dejados por los revisores antes de redactar la resolución de arbitraje.",
            "La resolución ingresada quedará registrada de forma permanente en la bitácora inmutable de auditoría forense."
        ]
    },
    '/convocatorias': {
        icon: <Award size={24} className="text-brand" />,
        title: "Ciclos de Convocatorias",
        summary: "Administración y visualización de oportunidades de financiamiento de I+D.",
        description: "Permite a los docentes explorar las convocatorias vigentes y postular proyectos, y a los administradores crear nuevos ciclos con rúbricas asociadas.",
        steps: [
            {
                title: "Visualización de bases",
                description: "Explora la descripción, fecha límite de cierre, financiamiento máximo del proyecto y descarga el enlace de las bases oficiales."
            },
            {
                title: "Postulación directa",
                description: "Usa el botón 'Postular Ahora' en la convocatoria abierta para precargar los límites financieros y de rúbrica en tu proyecto."
            },
            {
                title: "Creación de ciclos (Admin)",
                description: "Define el presupuesto global del periodo, el año de normativa CACES y asocia la rúbrica evaluativa predefinida."
            }
        ],
        compliance: "Asegura la distribución equitativa y transparente del presupuesto institucional destinado al desarrollo científico y tecnológico.",
        tips: [
            "Revisa siempre la fecha límite de cierre; el sistema bloqueará automáticamente las postulaciones a las 23:59 de ese día.",
            "Asegúrate de que el presupuesto de tu proyecto no supere el monto máximo especificado por la convocatoria."
        ]
    }
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, pathname }) => {
    const config = HELP_MAP[pathname] || DEFAULT_CONFIG;
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');

    // Total steps = 1 (Summary) + config.steps.length + 1 (Compliance & Tips)
    const totalSteps = config.steps.length + 2;

    // Reset step index when active page changes or modal is closed/reopened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setDirection('next');
        }
    }, [pathname, isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setDirection('next');
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection('prev');
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleDotClick = (index: number) => {
        setDirection(index > currentStep ? 'next' : 'prev');
        setCurrentStep(index);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/75 backdrop-blur-md cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Dialog Card */}
            <div className="relative w-full max-w-lg bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border-thin flex items-center justify-center">
                            {config.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">
                                Guía Interactiva
                            </h3>
                            <p className="text-[9px] text-text-dim uppercase tracking-wider font-bold">
                                {config.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                        title="Cerrar Guía"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Animated Body Container */}
                <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative min-h-[300px] flex flex-col justify-between">
                    <div 
                        key={currentStep}
                        className={`flex-1 flex flex-col justify-center ${
                            direction === 'next' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
                        }`}
                    >
                        {currentStep === 0 && (
                            /* Step 0: Overview & Summary */
                            <div className="space-y-5 text-center px-2">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center text-brand shadow-inner animate-pulse">
                                    {config.icon}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase tracking-wider text-text-main">
                                        {config.title}
                                    </h4>
                                    <p className="text-[12px] font-bold text-text-main leading-snug max-w-sm mx-auto">
                                        {config.summary}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-bg-deep/30 border border-border-thin text-left">
                                    <p className="text-[11px] text-text-dim leading-relaxed font-medium">
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep > 0 && currentStep <= config.steps.length && (() => {
                            const stepIdx = currentStep - 1;
                            const step = config.steps[stepIdx];
                            return (
                                /* Step 1 to N: Sequential Instructions */
                                <div className="space-y-6 px-2 text-center">
                                    <div className="mx-auto w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-mono font-black text-brand">
                                        {currentStep}
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-brand">
                                            Paso {currentStep} de {config.steps.length}
                                        </span>
                                        <h4 className="text-sm font-bold text-text-main tracking-tight">
                                            {step.title}
                                        </h4>
                                    </div>
                                    <div className="p-5 rounded-xl bg-bg-deep/30 border border-border-thin text-left">
                                        <p className="text-[11.5px] text-text-dim leading-relaxed font-medium">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {currentStep === totalSteps - 1 && (
                            /* Final Step: Compliance & Quick Tips */
                            <div className="space-y-6 px-2">
                                {/* Compliance Banner */}
                                <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 flex items-start gap-4">
                                    <div className="p-2 bg-brand/10 rounded-lg text-brand shrink-0">
                                        <Award size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-text-main">
                                            Acreditación e Indicadores CACES
                                        </h5>
                                        <p className="text-[10.5px] text-text-dim leading-relaxed font-medium">
                                            {config.compliance}
                                        </p>
                                    </div>
                                </div>

                                {/* Tips list */}
                                <div className="space-y-3">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                        Consejos y Accesibilidad
                                    </h5>
                                    <ul className="space-y-2.5">
                                        {config.tips.map((tip, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[10.5px] text-text-dim leading-relaxed font-medium">
                                                <Zap size={11} className="text-amber-400 shrink-0 mt-0.5" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-border-thin bg-surface/50 flex items-center justify-between">
                    {/* Previous Button */}
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                            currentStep === 0 
                                ? 'opacity-30 pointer-events-none text-text-dim' 
                                : 'text-text-dim hover:text-text-main hover:translate-x-[-2px]'
                        }`}
                        title="Anterior"
                    >
                        <ChevronLeft size={14} />
                        <span>Atras</span>
                    </button>

                    {/* Navigation Dots Indicator */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleDotClick(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === currentStep 
                                        ? 'w-4 bg-brand' 
                                        : 'w-1.5 bg-border-hover hover:bg-text-dim'
                                }`}
                                title={`Ir a la diapositiva ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Next or Finish Button */}
                    {currentStep === totalSteps - 1 ? (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all duration-200 cursor-pointer hover:scale-[1.03] shadow-md shadow-brand/10"
                            title="Finalizar"
                        >
                            <span>Entendido</span>
                            <Check size={12} />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand hover:text-brand-light transition-all duration-200 cursor-pointer hover:translate-x-[2px]"
                            title="Siguiente"
                        >
                            <span>Siguiente</span>
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
