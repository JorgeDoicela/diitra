import { 
    Activity, Settings2, BarChart3, Bell, ShieldCheck, Award
} from 'lucide-react';
import type { HelpConfig, MockupProps } from '../types';

export const DEFAULT_CONFIG: HelpConfig = {
    icon: <Settings2 size={24} className="text-brand" />,
    title: "Módulo General del Sistema",
    summary: "Consola unificada de acceso y administración del ecosistema de investigación y desarrollo tecnológico DIITRA.",
    description: "Este módulo sirve como marco operativo para interactuar de forma segura con todas las funciones de investigación. Centraliza el panel de navegación de la plataforma, el lanzador de comandos de acceso global y el conmutador de visualización visual adaptativa para los perfiles académicos de la institución.",
    steps: [
        {
            title: "Navegación general y jerarquía lateral",
            description: "Usa el panel de navegación principal situado a la izquierda para desplazarte entre los módulos disponibles. Las opciones del menú se cargan dinámicamente según tus permisos asignados (Docente Investigador, Revisor de Pares, Comité Evaluador o Administrador). La barra puede contraerse mediante el control en la esquina superior para maximizar el área de trabajo en pantallas táctiles o portátiles.",
            highlight: 'sidebar'
        },
        {
            title: "Ayuda e información contextual en vivo",
            description: "Puedes invocar la guía interactiva en cualquier momento del flujo de trabajo haciendo clic en el control de tres puntos de la barra superior. La guía analizará de manera transparente la ruta del sistema en la que te encuentras y ofrecerá explicaciones detalladas y específicas del módulo actual.",
            highlight: 'topbar'
        }
    ],
    compliance: "Este módulo cumple con los estándares mínimos de accesibilidad digital y seguridad de la información exigidos en los criterios generales de administración e infraestructura de los modelos de evaluación externa y acreditación del CACES.",
    tips: [
        "Presiona 'Alt + K' en Windows/Linux o 'Option + K' en macOS en cualquier parte del sistema para desplegar la paleta de comandos de búsqueda profesional de archivos y acciones.",
        "Ajusta el tamaño del menú de navegación lateral arrastrando el borde exterior hacia la derecha o hacia la izquierda según tu preferencia visual."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`grid grid-cols-3 gap-1.5 shrink-0 transition-all duration-300 ${highlightTopClass}`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-1 flex flex-col gap-1">
                        <div className="w-2/3 h-1.5 bg-text-dim/20 rounded" />
                        <div className="w-1/2 h-3.5 bg-text-main/30 rounded" />
                    </div>
                ))}
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="flex items-center justify-between border-b border-border-thin/40 pb-1">
                    <div className="w-1/3 h-2 bg-text-main/20 rounded" />
                    <div className="w-1/6 h-2 bg-text-dim/15 rounded" />
                </div>
                <div className="space-y-1 flex-1 py-1">
                    <div className="w-full h-2 bg-text-dim/10 rounded-sm" />
                    <div className="w-full h-2 bg-text-dim/5 rounded-sm" />
                </div>
            </div>
        </>
    )
};

export const DASHBOARD_CONFIG: HelpConfig = {
    icon: <Activity size={24} className="text-brand animate-pulse" />,
    title: "Panel de Control de Investigación",
    summary: "Tablero centralizado de mando ejecutivo con indicadores cuantitativos y accesos directos al perfil del investigador.",
    description: "El panel principal centraliza el estado global de tus investigaciones académicas y del nivel de cumplimiento científico del instituto. Ofrece información instantánea sobre tu carga horaria dedicada a la investigación científica, presupuesto del departamento, estado de revisiones en curso y enlaces interactivos para iniciar tareas clave en pocos clics.",
    steps: [
        {
            title: "Monitoreo en tiempo real de KPIs científicos",
            description: "Examina los contadores principales en la parte superior del tablero. Estas tarjetas informativas reflejan el número de proyectos aprobados, los productos científicos publicados en el periodo actual, las horas asignadas en tu distributivo académico y el presupuesto financiero ejecutado. Se sincronizan directamente con las bases del SIGAFI.",
            highlight: 'content-top'
        },
        {
            title: "Accesos directos Bento y bandeja de actividades",
            description: "Usa las tarjetas de acceso rápido para crear una nueva postulación, firmar el informe final, revisar el historial de actividad o consultar documentos oficiales sin navegar manualmente por el menú.",
            highlight: 'content-bottom'
        },
        {
            title: "Identificación de rol institucional y sesión activa",
            description: "Verifica tu cargo activo, departamento académico y el campus asignado (por ejemplo, Instituto Tecnológico Traversari) que se muestran de forma destacada en la cabecera. Es de suma importancia corroborar que tu rol (como Docente Investigador) sea el correcto para que se activen las reglas de negocio de tus convocatorias y el flujo de firmas digitales.",
            highlight: 'topbar'
        }
    ],
    compliance: "Mapea directamente los indicadores del Criterio B.1.1 (Vinculación del Claustro Docente con la Investigación) del CACES, certificando el porcentaje de profesores de tiempo completo asignados formalmente a proyectos y la ejecución de horas de investigación validadas.",
    tips: [
        "Si observas que tus horas asignadas en investigación no corresponden a tu distributivo, contacta al administrador del sistema para iniciar una resincronización forzada con el área académica.",
        "Utiliza el atajo del buscador rápido superior para localizar expedientes de investigación utilizando únicamente el código alfanumérico institucional."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 ${highlightTopClass}`}>
                        <div className="w-2/3 h-1.5 bg-text-dim/20 rounded" />
                        <div className="w-1/2 h-3.5 bg-text-main/30 rounded" />
                    </div>
                ))}
            </div>
            <div className="flex-1 flex gap-1.5 min-h-0">
                <div className={`flex-[1.2] rounded-lg border p-2 flex flex-col justify-between transition-all duration-300 ${highlightBottomClass}`}>
                    <div className="w-1/2 h-2 bg-text-main/20 rounded" />
                    <div className="flex items-end gap-1 h-12 pt-2">
                        <div className="w-1/4 h-3/5 bg-brand/40 rounded-sm" />
                        <div className="w-1/4 h-4/5 bg-brand/60 rounded-sm animate-pulse" />
                        <div className="w-1/4 h-2/5 bg-brand/30 rounded-sm" />
                        <div className="w-1/4 h-full bg-brand rounded-sm" />
                    </div>
                </div>
                <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                    <div className="w-3/4 h-2 bg-text-main/15 rounded" />
                    <div className="space-y-1 flex-1 py-1">
                        <div className="w-full h-3.5 bg-text-dim/10 rounded-md border border-border-thin flex items-center justify-center text-[7px] text-text-dim">Crear</div>
                        <div className="w-full h-3.5 bg-text-dim/10 rounded-md border border-border-thin flex items-center justify-center text-[7px] text-text-dim">Informe</div>
                    </div>
                </div>
            </div>
        </>
    )
};

export const SETTINGS_CONFIG: HelpConfig = {
    icon: <Settings2 size={24} className="text-brand" />,
    title: "Mi Cuenta y Firma Electrónica",
    summary: "Consola de configuración personal, credenciales académicas y gestión de firma electrónica.",
    description: "Espacio individual para que el docente o usuario administre sus datos personales, perfiles de investigación (ORCID, Google Scholar) y configure la firma digital necesaria para la suscripción académica.",
    steps: [
        {
            title: "Gestión de información de perfil y filiación",
            description: "Actualiza tus datos de contacto, enlaces académicos externos como ORCID o Scopus ID, e información de tu departamento para asegurar que tus firmas de reportes y entregables se generen con metadatos correctos.",
            highlight: 'content-top'
        },
        {
            title: "Seguridad y firma electrónica cifrada",
            description: "Administra tu certificado de firma electrónica (token o archivo p12) y otorga el consentimiento de custodia para firmar actas e informes técnicos.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Alineado con el Criterio de Infraestructura y Transparencia del CACES para la gestión de claustro docente e investigadores autorizados.",
    tips: [
        "Mantén vinculados y actualizados tus perfiles de ORCID y Google Scholar para permitir la sincronización automatizada de tu producción científica periódica.",
        "Por seguridad, el certificado .p12 y su clave se cifran bajo AES-256 antes de guardarse en la base de datos."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="flex gap-2 items-center pb-1 border-b border-border-thin/20">
                    <div className="w-6 h-6 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-[7px] text-brand">PD</div>
                    <div className="space-y-0.5">
                        <div className="w-12 h-2 bg-text-main/20 rounded" />
                        <div className="w-8 h-1 bg-text-dim/10 rounded" />
                    </div>
                </div>
                <div className="space-y-1.5 py-1">
                    <div className="w-full h-3 bg-text-dim/10 rounded-sm border border-border-thin" />
                    <div className="w-3/4 h-3 bg-text-dim/10 rounded-sm border border-border-thin" />
                </div>
            </div>
        </>
    )
};

export const ARCO_CONFIG: HelpConfig = {
    icon: <ShieldCheck size={24} className="text-brand" />,
    title: "Derechos ARCO · Protección de Datos",
    summary: "Portal del usuario para el ejercicio de sus derechos de protección de datos (ARCO).",
    description: "DIITRA garantiza el ejercicio de sus derechos de Acceso, Rectificación, Cancelación y Oposición sobre sus datos personales conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.",
    steps: [
        {
            title: "Presentación de nueva solicitud",
            description: "Seleccione el tipo de derecho que desea ejercer (Acceso, Rectificación, Eliminación, Oposición, Portabilidad o Limitación) y describa detalladamente su justificación en el formulario.",
            highlight: 'content-top'
        },
        {
            title: "Seguimiento e historial de resoluciones",
            description: "Revise el historial de sus peticiones presentadas. Por ley, el instituto cuenta con un plazo de 15 días laborables para emitir una resolución formal y dictamen legal.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Alineado con el Título III de la LOPDP sobre los Derechos de los Titulares de Datos Personales en el Ecuador.",
    tips: [
        "Describa de la forma más clara posible los registros o datos específicos que desea modificar o eliminar para agilizar el análisis del departamento legal.",
        "Las resoluciones emitidas por el administrador del sistema quedarán registradas de forma permanente en su historial."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                <div className="w-1/5 h-5 bg-brand text-white rounded flex items-center justify-center text-[6px] font-semibold">Enviar</div>
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="w-3/4 h-2 bg-text-main/20 rounded" />
                <div className="w-full h-8 bg-text-dim/10 rounded border border-border-thin" />
            </div>
        </>
    )
};

export const LOPDP_ADMIN_CONFIG: HelpConfig = {
    icon: <ShieldCheck size={24} className="text-brand" />,
    title: "Panel de Administración LOPDP",
    summary: "Consola de gobernanza y auditoría de protección de datos personales para administradores.",
    description: "Permite a los administradores del sistema responder legalmente a las peticiones de Derechos ARCO presentadas y auditar la bitácora completa de consentimientos otorgados y revocados.",
    steps: [
        {
            title: "Resolución legal de peticiones ARCO",
            description: "Revise la lista de peticiones pendientes y seleccione una para analizarla. Ingrese el dictamen legal formal y actualice su estado a Aprobado, Rechazado o En Análisis.",
            highlight: 'content-top'
        },
        {
            title: "Auditoría de consentimiento digital",
            description: "Consulte la tabla de consentimientos para verificar la fecha, versión de la política aceptada, dirección IP y el user-agent del navegador del titular al otorgar o revocar su autorización.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Asegura el registro permanente y el cumplimiento de las obligaciones institucionales del Responsable de Tratamiento establecidas en la Ley Orgánica de Protección de Datos Personales (LOPDP).",
    tips: [
        "Es obligatorio incluir una justificación o dictamen legal debidamente fundamentado para cualquier resolución, especialmente al rechazar una solicitud.",
        "Utilice los filtros y ordenamiento para priorizar aquellas peticiones que se encuentran próximas a vencer su plazo de SLA (15 días)."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-8 rounded-lg border px-2 flex items-center gap-2 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-16 h-3 bg-brand/10 border border-brand/20 rounded" />
                <div className="w-16 h-3 bg-text-dim/10 rounded" />
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="w-full h-8 bg-text-dim/10 rounded border border-border-thin" />
                <div className="w-full h-8 bg-text-dim/10 rounded border border-border-thin" />
            </div>
        </>
    )
};

export const ANALYTICS_CONFIG: HelpConfig = {
    icon: <BarChart3 size={24} className="text-brand" />,
    title: "Analíticas de Investigación y Acreditación",
    summary: "Tablero predictivo y de Business Intelligence para el monitoreo de indicadores de calidad institucional.",
    description: "Consola gerencial de analíticas diseñada para evaluar el desempeño de la producción científica y tecnológica de la institución. Permite a las autoridades analizar gráficos interactivos de avance, proyectar el cumplimiento de metas y exportar reportes ejecutivos consolidados para la toma de decisiones estratégicas ante el comité directivo.",
    steps: [
        {
            title: "Filtros multidimensionales y segmentación de datos",
            description: "Utiliza las herramientas superiores para segmentar la información estadística de la plataforma. Puedes filtrar los indicadores generales por periodo académico, instituto, facultades, carreras docentes específicas, líneas de investigación o estados de proyectos, actualizando los gráficos al instante.",
            highlight: 'content-top'
        },
        {
            title: "Análisis comparativo de indicadores CACES",
            description: "Monitorea la sección de cumplimiento donde se grafican en tiempo real tus métricas versus las metas nacionales. El sistema despliega alertas visuales en semáforo (Rojo: Alerta Crítica, Amarillo: Cerca de la Meta, Verde: Cumplimiento Aprobado) analizando indicadores de publicaciones por docente y presupuestos ejecutados.",
            highlight: 'content-bottom'
        },
        {
            title: "Exportación de informes ejecutivos en PDF",
            description: "Usa el botón 'Exportar PDF' para generar y descargar un informe ejecutivo completo con todos los gráficos, tablas comparativas de rendimiento, listados de publicaciones indexadas activas y dictámenes cuantitativos del periodo, optimizado para impresión y presentación formal.",
            highlight: 'content-top'
        }
    ],
    compliance: "Módulo principal de justificación cuantitativa y análisis predictivo en las fases de evaluación interna y externa del CACES, certificando las métricas de efectividad de las políticas de fomento a la investigación institucional.",
    tips: [
        "Haz clic sobre los segmentos del gráfico de donut de estados de proyectos para abrir la lista filtrada de las propuestas específicas vinculadas a esa métrica.",
        "Usa el botón de actualización forzada de datos para recalcular las proyecciones en caso de que existan actas de arbitraje firmadas recientemente."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                <div className="w-1/5 h-5 bg-brand/10 border border-brand/20 rounded flex items-center justify-center text-[6px] text-brand font-semibold">PDF</div>
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="flex-1 flex flex-col items-center justify-center gap-1 border border-border-thin/40 rounded p-1 bg-surface-hover/30">
                    <div className="w-7 h-7 rounded-full border-4 border-brand border-r-transparent" />
                    <div className="w-10 h-1 bg-text-dim/20 rounded" />
                </div>
                <div className="flex-1 flex items-end gap-1 border border-border-thin/40 rounded p-1.5 justify-center">
                    <div className="w-2.5 h-1/3 bg-success/60 rounded-t-sm" />
                    <div className="w-2.5 h-2/3 bg-brand/60 rounded-t-sm" />
                    <div className="w-2.5 h-full bg-brand/80 rounded-t-sm animate-pulse" />
                </div>
            </div>
        </>
    )
};

export const NOTIFICATIONS_CONFIG: HelpConfig = {
    icon: <Bell size={24} className="text-brand" />,
    title: "Bandeja y Centro de Notificaciones",
    summary: "Canal formal de notificaciones del sistema, alertas del flujo de trabajo académico y firmas pendientes.",
    description: "Bandeja centralizada que agrupa todas las comunicaciones automáticas y alertas del sistema. Te notifica sobre asignaciones de proyectos para revisión, comentarios de evaluadores pares, plazos de entregables a vencer, citaciones a comités de arbitraje y solicitudes de firma digital de actas y contratos oficiales.",
    steps: [
        {
            title: "Filtros temáticos y pestañas de bandeja",
            description: "Organiza tu flujo de trabajo navegando entre las pestañas del buzón: 'Sin leer' (alertas nuevas prioritarias), 'Urgente' (solicitudes de firmas o hitos vencidos), 'Investigaciones' (cambios en el estado de tus propuestas) y 'Sistema' (mensajes de mantenimiento general o actualizaciones de la cuenta).",
            highlight: 'content-top'
        },
        {
            title: "Acciones masivas y limpieza del Inbox",
            description: "Mantén ordenado tu buzón de alertas utilizando la opción de 'Marcar como leídas' en bloque. Esto desactivará los contadores numéricos y los globos de notificación en la barra superior, pero conservará los mensajes en el archivo histórico para futuras referencias.",
            highlight: 'content-top'
        },
        {
            title: "Enlaces contextuales y navegación al origen",
            description: "Haz clic sobre el cuerpo de cualquier notificación para ir directamente al módulo de origen del mensaje. El sistema abrirá automáticamente el contrato específico que debes firmar, el entregable rechazado por el revisor o la bitácora de observaciones que debes subsanar.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Cumple con las directrices de comunicación formal y debido proceso exigidas en los reglamentos de régimen académico de la institución, asegurando el registro de la entrega de dictámenes y requerimientos oficiales.",
    tips: [
        "Las notificaciones de la categoría 'Urgente' contienen plazos de validez para firmas electrónicas que expiran automáticamente en la fecha indicada.",
        "Puedes configurar alertas secundarias a tu correo electrónico institucional desde tu panel de perfil en la barra lateral."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-7 rounded-lg border px-1.5 flex items-center gap-1 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-8 h-3.5 rounded bg-brand/10 border border-brand/20 text-[6px] text-brand flex items-center justify-center font-semibold">Inbox</div>
                <div className="w-8 h-3.5 rounded bg-text-dim/5 text-[6px] text-text-dim flex items-center justify-center">Leídas</div>
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1 transition-all duration-300 ${highlightBottomClass}`}>
                <div className="flex items-center gap-2 py-0.5 border-b border-border-thin/20">
                    <div className="w-2 h-2 rounded-full bg-error shrink-0" />
                    <div className="w-2/3 h-1.5 bg-text-main/20 rounded" />
                </div>
                <div className="flex items-center gap-2 py-0.5 border-b border-border-thin/20">
                    <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                    <div className="w-3/4 h-1.5 bg-text-main/20 rounded" />
                </div>
            </div>
        </>
    )
};

export const VERIFY_CONFIG: HelpConfig = {
    icon: <ShieldCheck size={24} className="text-brand" />,
    title: "Verificación de Certificados y Autenticidad",
    summary: "Portal público para verificar la autenticidad de reportes y actas electrónicas del sistema.",
    description: "Herramienta pública para verificar la autenticidad de documentos formales, actas o certificados generados por DIITRA. Al ingresar el código del documento o escanear el QR, el sistema comprueba en la base de datos si el archivo es válido y no ha sido alterado.",
    steps: [
        {
            title: "Validación por código institucional",
            description: "Ingresa el identificador alfanumérico único impreso en el pie de página del certificado físico en el campo de búsqueda. Haz clic en 'Validar' para consultar el estado del registro, devolviendo la fecha exacta de emisión y los nombres de los firmantes autorizados.",
            highlight: 'content-top'
        },
        {
            title: "Escaneo rápido mediante código QR",
            description: "Utiliza tu cámara web o el escáner de tu dispositivo móvil sobre el código QR del documento para acceder al enlace de validación directa. Este método evita errores de transcripción alfanumérica y procesa la autenticación de manera automática e instantánea.",
            highlight: 'content-top'
        },
        {
            title: "Dictamen de autenticidad y firmas digitales",
            description: "Inspecciona el bloque de resultados del validador. Mostrará el estado del documento ('VIGENTE' o 'ANULADO'), el firmante del comité y si el archivo es auténtico según el código de verificación del sistema.",
            highlight: 'content-bottom'
        }
    ],
    compliance: "Alineado con las directrices de la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos del Ecuador, asegurando la validez legal de las actas de investigación ante visitas de acreditación del CACES.",
    tips: [
        "Este portal público de validación no requiere inicio de sesión, facilitando que entidades externas de educación superior o auditores del CES verifiquen la autenticidad del documento de manera autónoma.",
        "Si un documento fue alterado, el sistema alertará de inmediato que el código de verificación no coincide, detectando posibles falsificaciones."
    ],
    Mockup: ({ highlightTopClass, highlightBottomClass }: MockupProps) => (
        <>
            <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                <div className="w-2/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                <div className="w-1/5 h-5 bg-brand text-white rounded flex items-center justify-center text-[7px] font-semibold">Validar</div>
            </div>
            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-2 justify-center items-center transition-all duration-300 ${highlightBottomClass}`}>
                <div className="w-12 h-12 border-2 border-brand/50 border-dashed rounded-lg flex items-center justify-center relative bg-brand/5">
                    <div className="absolute inset-x-2 h-[1px] bg-brand animate-bounce" />
                    <div className="w-8 h-8 bg-text-dim/10 rounded-sm" />
                </div>
                <div className="w-20 h-2 bg-success/20 border border-success/30 rounded text-[6px] text-success text-center">Documento Auténtico</div>
            </div>
        </>
    )
};

export const CONVOCATORIAS_CONFIG: HelpConfig = {
    icon: <Award size={24} className="text-brand" />,
    title: "Administración de Convocatorias Científicas",
    summary: "Consola de visualización, exploración y administración de ciclos de financiamiento y postulación científica.",
    description: "Módulo enfocado en la visualización de las oportunidades de postulación a fondos internos y externos de investigación. Permite a los docentes explorar las bases y cronogramas de participación, y a los directores del departamento crear nuevos periodos de postulación, definir presupuestos máximos y vincular las rúbricas de evaluación oficiales.",
    steps: [
        {
            title: "Consulta de bases y límites límites financieros",
            description: "Explora la ficha técnica de la convocatoria activa. Revisa la descripción, la población objetivo (por ejemplo: Docentes investigadores a tiempo completo), las fechas límite improrrogables de postulación, el financiamiento máximo asignable por propuesta y descarga las guías oficiales en PDF.",
            highlight: 'content-bottom'
        },
        {
            title: "Postulación y precarga de parámetros de la convocatoria",
            description: "Al hacer clic en 'Postular Ahora' en una convocatoria abierta, el sistema abrirá el asistente de postulación de proyectos precargando automáticamente las reglas presupuestarias correspondientes. Esto evitará que ingreses rubros de gastos no permitidos o superes el presupuesto máximo.",
            highlight: 'content-bottom'
        },
        {
            title: "Creación y configuración de convocatorias (Administrador)",
            description: "Crea y configura nuevos ciclos de investigación definiendo las fechas de postulación, las fechas de evaluación ciega, el presupuesto total institucional asignado, y viniendo la rúbrica de evaluación CACES obligatoria que utilizarán los revisores externos.",
            highlight: 'content-top'
        }
    ],
    compliance: "Garantiza la distribución equitativa, transparente y por concurso de méritos de los presupuestos asignados a la investigación científica en las instituciones de educación superior, un indicador clave del Modelo de Evaluación del CACES.",
    tips: [
        "El sistema bloquea automáticamente la postulación a las 23:59:59 del día de cierre indicado en la convocatoria. No se podrán realizar excepciones porque los plazos quedan registrados de forma permanente.",
        "Asegúrate de que la línea de investigación seleccionada en tu propuesta esté habilitada en los términos específicos de la convocatoria para evitar descalificaciones automáticas."
    ],
    Mockup: ({ highlightBottomClass }: MockupProps) => (
        <>
            <div className={`flex-1 grid grid-cols-2 gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border p-1.5 flex flex-col justify-between bg-surface border-border-thin">
                        <div className="space-y-1">
                            <div className="w-4/5 h-2 bg-text-main/20 rounded" />
                            <div className="w-full h-1 bg-text-dim/10 rounded" />
                        </div>
                        <div className="w-full h-3.5 bg-brand text-white rounded flex items-center justify-center text-[5px] font-semibold mt-2">Postular</div>
                    </div>
                ))}
            </div>
        </>
    )
};
