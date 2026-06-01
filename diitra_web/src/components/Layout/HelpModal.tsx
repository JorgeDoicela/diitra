import React, { useState, useEffect } from 'react';
import { 
    X, BookOpen, Activity, Shield, History, 
    Settings2, BarChart3, Bell, ShieldCheck, PenTool, Scale,
    Award, Zap, ChevronLeft, ChevronRight, Check
} from 'lucide-react';

interface HelpStep {
    title: string;
    description: string;
    highlight: 'sidebar' | 'topbar' | 'content-top' | 'content-bottom' | 'all';
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
        "Presiona 'Ctrl + K' en Windows/Linux o 'Cmd + K' en macOS en cualquier parte del sistema para desplegar la paleta de comandos de búsqueda profesional de archivos y acciones.",
        "Ajusta el tamaño del menú de navegación lateral arrastrando el borde exterior hacia la derecha o hacia la izquierda según tu preferencia visual."
    ]
};

const HELP_MAP: Record<string, HelpConfig> = {
    '/dashboard': {
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
                description: "Interactúa con las tarjetas dinámicas de estilo Bento para ejecutar acciones rápidas. Desde aquí puedes crear una nueva postulación de proyecto, acceder a la bandeja de firmas del informe final, revisar la bitácora histórica de transacciones o consultar los expedientes inmutables sin navegar manualmente por el menú.",
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
        ]
    },
    '/investigacion': {
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
        ]
    },
    '/investigacion/mis-proyectos': {
        icon: <BookOpen size={24} className="text-brand" />,
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
        ]
    },
    '/usuarios': {
        icon: <Shield size={24} className="text-brand" />,
        title: "Consola de Gestión de Usuarios y Roles",
        summary: "Control administrativo de identidades, perfiles académicos y asignación de capacidades del claustro.",
        description: "Sección exclusiva para la administración central orientada a la gestión de accesos y configuración de permisos de usuarios en DIITRA. Facilita la asignación rápida de roles clave, la habilitación de firmas digitales y el registro exhaustivo de evaluadores y revisores pares externos para procesos de evaluación doble ciego.",
        steps: [
            {
                title: "Asignación dinámica de roles y capacidades",
                description: "Administra los accesos activando o desactivando permisos específicos directamente en la lista de usuarios. Puedes otorgar múltiples roles a un docente (por ejemplo: Docente e Investigador o Revisor Externo) lo que modificará de inmediato las vistas, opciones del menú lateral y facultades operativas del usuario al iniciar sesión.",
                highlight: 'content-bottom'
            },
            {
                title: "Registro formal de evaluadores externos",
                description: "Usa el botón de acción rápida 'Nuevo Externo' para registrar profesionales evaluadores de otras universidades del país o del extranjero. Es obligatorio detallar su cédula o pasaporte, afiliación institucional, correo electrónico formal, especialidad UNESCO y su enlace de perfil ORCID para la validación automática de producción científica.",
                highlight: 'content-top'
            },
            {
                title: "Auditoría de firmas y perfiles digitales académicos",
                description: "Haz clic en cualquier usuario de la tabla para abrir el panel lateral de detalles de metadatos. Aquí se almacena la información complementaria de la hoja de vida académica, el estado de validación de su firma electrónica (firma en archivo o token), su historial de accesos recientes e IP de conexión para fines de control de seguridad.",
                highlight: 'content-bottom'
            }
        ],
        compliance: "Respalda la transparencia en la conformación del tribunal evaluador externo exigido por el CACES, asegurando el debido proceso y la idoneidad técnica en las evaluaciones de proyectos bajo normas nacionales e internacionales.",
        tips: [
            "Al crear un nuevo evaluador externo, el sistema le enviará de manera automática un correo con sus credenciales de acceso seguras y un enlace temporal de activación de firma electrónica.",
            "Utiliza el filtro de roles para listar únicamente a los usuarios con permisos de revisión académica externa para agilizar las designaciones de tribunales."
        ]
    },
    '/auditoria': {
        icon: <History size={24} className="text-brand" />,
        title: "Trazabilidad de Auditoría Forense",
        summary: "Bitácora inmutable de transacciones y control de cambios forenses en la base de datos.",
        description: "Módulo forense de alta seguridad diseñado para el registro cronológico e inmutable de toda acción crítica realizada en la base de datos de DIITRA. Permite rastrear con precisión absoluta qué usuario realizó una modificación, qué campos cambiaron, la fecha, hora exacta, dirección IP, User Agent de conexión y el hash de verificación de la transacción.",
        steps: [
            {
                title: "Filtros de búsqueda y parametrización forense",
                description: "Utiliza el panel de búsqueda superior para filtrar las transacciones. Puedes acotar los registros por módulo específico del sistema (por ejemplo: Proyectos, Usuarios, Finanzas), acción ejecutada (Inserción, Actualización, Eliminación), rango de fechas con marcas de tiempo y el identificador único del usuario operante.",
                highlight: 'content-top'
            },
            {
                title: "Inspección de diferencias estructuradas (Diff)",
                description: "Haz clic en cualquier registro de la bitácora para desplegar el visor de diferencias comparativo. El sistema mostrará un análisis de campos estructurado, indicando el estado del registro 'Antes' de la modificación (en color rojo/negativo) y el estado del registro 'Después' de la modificación (en color verde/positivo) en formato JSON.",
                highlight: 'content-bottom'
            },
            {
                title: "Exportación certificada de reportes y firmas criptográficas",
                description: "Utiliza el botón 'Exportar Reporte' para generar un archivo Excel certificado digitalmente. Este archivo incluye todas las columnas de auditoría técnica y se encuentra firmado con el hash SHA-256 del servidor de base de datos, garantizando que los registros no han sido alterados manualmente desde su creación.",
                highlight: 'content-top'
            }
        ],
        compliance: "Garantiza el cumplimiento estricto de los estándares internacionales de seguridad y la normativa de inmutabilidad de la información exigida en los procesos de auditoría tecnológica y licenciamiento del CACES y entes reguladores de protección de datos (LOPDP).",
        tips: [
            "Puedes copiar directamente el fragmento JSON del Diff de cambios con el botón de copiado rápido en el panel lateral para compartirlo con el equipo de soporte técnico en caso de auditorías externas.",
            "Los registros de eliminación de borradores de proyectos guardan el contenido completo del protocolo para permitir su recuperación rápida en caso de incidentes."
        ]
    },
    '/configuracion': {
        icon: <Settings2 size={24} className="text-brand" />,
        title: "Consola de Configuración del Sistema",
        summary: "Panel de control para la parametrización de catálogos oficiales, ciclos académicos e indicadores del CACES.",
        description: "Módulo administrativo enfocado en la configuración global de los parámetros operativos de DIITRA. Permite a los directivos actualizar las líneas oficiales de investigación del instituto, dar mantenimiento a las ponderaciones de productos académicos, establecer períodos académicos de postulación y definir las metas anuales de los indicadores del CACES.",
        steps: [
            {
                title: "Catálogo de líneas y dominios de investigación",
                description: "Define, edita y administra el catálogo oficial de líneas y sublíneas de investigación alineadas con los dominios académicos aprobados por el Consejo de Educación Superior (CES) y la SENESCYT. Las nuevas propuestas de proyectos deberán alinearse de forma obligatoria a estas directrices para ser admitidas.",
                highlight: 'content-bottom'
            },
            {
                title: "Administración de periodos académicos y productos",
                description: "Abre o cierra los semestres de investigación del sistema. Configura los tipos de productos científicos admisibles (artículos en Scopus, Latindex, libros, capítulos de libros, patentes) indicando las evidencias digitales obligatorias para cada uno y su puntaje de peso relativo dentro del indicador institucional.",
                highlight: 'content-bottom'
            },
            {
                title: "Ponderaciones y metas cuantitativas del CACES",
                description: "Introduce las metas anuales exigidas por la normativa vigente para acreditar los indicadores institucionales (como la relación de horas del cuerpo académico, número mínimo de artículos indexados por docente). El módulo de Analíticas comparará los datos reales con estos parámetros definidos para medir el nivel de preparación institucional.",
                highlight: 'content-bottom'
            }
        ],
        compliance: "Estructura la base paramétrica e institucional de clasificación científica exigida por el CES, la SENESCYT y los entes de acreditación nacional para los reportes oficiales anuales de producción de educación superior.",
        tips: [
            "Desactivar una línea de investigación no afectará a los proyectos en curso que la utilicen, pero impedirá que nuevos investigadores la seleccionen en futuras convocatorias.",
            "Establece las fechas de cierre de periodos académicos con suficiente antelación para que el sistema envíe recordatorios automáticos de carga horaria a los docentes."
        ]
    },
    '/analiticas': {
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
                title: "Exportación y generación de Dossiers Ejecutivos PDF",
                description: "Usa el botón 'Exportar PDF' para generar y descargar un informe ejecutivo completo con todos los gráficos, tablas comparativas de rendimiento, listados de publicaciones indexadas activas y dictámenes cuantitativos del periodo, optimizado para impresión y presentación formal.",
                highlight: 'content-top'
            }
        ],
        compliance: "Módulo principal de justificación cuantitativa y análisis predictivo en las fases de evaluación interna y externa del CACES, certificando las métricas de efectividad de las políticas de fomento a la investigación institucional.",
        tips: [
            "Haz clic sobre los segmentos del gráfico de donut de estados de proyectos para abrir la lista filtrada de las propuestas específicas vinculadas a esa métrica.",
            "Usa el botón de actualización forzada de datos para recalcular las proyecciones en caso de que existan actas de arbitraje firmadas recientemente."
        ]
    },
    '/notificaciones': {
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
        compliance: "Cumple con las directrices de comunicación formal y debido proceso exigidas en los reglamentos de régimen académico de la institución, asegurando la trazabilidad de la entrega de dictámenes y requerimientos oficiales.",
        tips: [
            "Las notificaciones de la categoría 'Urgente' contienen plazos de validez para firmas electrónicas que expiran automáticamente en la fecha indicada.",
            "Puedes configurar alertas secundarias a tu correo electrónico institucional desde tu panel de perfil en la barra lateral."
        ]
    },
    '/verify': {
        icon: <ShieldCheck size={24} className="text-brand" />,
        title: "Verificación de Certificados y Autenticidad",
        summary: "Portal criptográfico público para la validación de reportes y actas electrónicas del sistema.",
        description: "Herramienta pública y de acceso abierto para la validación criptográfica de cualquier documento formal, acta de arbitraje o certificado generado por DIITRA. Al ingresar el código único del documento o escanear el QR, el sistema realiza una comprobación hash SHA-256 en la base de datos central para certificar su validez e inmutabilidad.",
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
                description: "Inspecciona el bloque de resultados del validador. Mostrará la información detallada del documento: estado actual ('VIGENTE' o 'ANULADO'), el firmante del comité y la validez legal del archivo basada en el hash de auditoría inmutable del servidor de base de datos.",
                highlight: 'content-bottom'
            }
        ],
        compliance: "Alineado con las directrices de la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos del Ecuador, asegurando la validez legal de las actas de investigación ante visitas de acreditación del CACES.",
        tips: [
            "Este portal público de validación no requiere inicio de sesión, facilitando que entidades externas de educación superior o auditores del CES verifiquen la autenticidad del documento de manera autónoma.",
            "Si un documento modificado ilegalmente es procesado por este módulo, el sistema alertará de inmediato que el hash de verificación no coincide, detectando posibles falsificaciones."
        ]
    },
    '/revisiones': {
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
        ]
    },
    '/arbitraje': {
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
                description: "Registra la decisión unificada del comité (Aprobación Definitiva, Correcciones Mayores con Nuevo Revisor o Rechazo Permanente). Es obligatorio transcribir el acta de resolución del comité, ingresar el código de la sesión plenaria del consejo científico y adjuntar el acta escaneada debidamente firmada.",
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
        ]
    },
    '/convocatorias': {
        icon: <Award size={24} className="text-brand" />,
        title: "Administración de Convocatorias Científicas",
        summary: "Consola de visualización, exploración y administración de ciclos de financiamiento y postulación científica.",
        description: "Módulo enfocado en la visualización de las oportunidades de postulación a fondos internos y externos de investigación. Permite a los docentes explorar las bases y cronogramas de participación, y a los directores del departamento crear nuevos periodos de postulación, definir presupuestos máximos y vincular las rúbricas de evaluación oficiales.",
        steps: [
            {
                title: "Consulta de bases y límites financieros",
                description: "Explora la ficha técnica de la convocatoria activa. Revisa la descripción, la población objetivo (por ejemplo: Docentes investigadores a tiempo completo), las fechas límite improrrogables de postulación, el financiamiento máximo asignable por propuesta y descarga las guías oficiales en PDF.",
                highlight: 'content-bottom'
            },
            {
                title: "Postulación y precarga de parámetros de la convocatoria",
                description: "Al hacer clic en 'Postular Ahora' en una convocatoria abierta, el sistema abrirá el asistente de postulación de proyectos precargando automáticamente las reglas presupuestarias correspondientes. Esto evitará que ingreses rubros de gastos no permitidos o superes el presupuesto máximo.",
                highlight: 'content-bottom'
            },
            {
                title: "Creación y parametrización de convocatorias (Administrador)",
                description: "Crea y configura nuevos ciclos de investigación definiendo las fechas de postulación, las fechas de evaluación ciega, el presupuesto total institucional asignado, y vinculando la rúbrica de evaluación CACES obligatoria que utilizarán los revisores externos.",
                highlight: 'content-top'
            }
        ],
        compliance: "Garantiza la distribución equitativa, transparente y por concurso de méritos de los presupuestos asignados a la investigación científica en las instituciones de educación superior, un indicador clave del Modelo de Evaluación del CACES.",
        tips: [
            "El sistema bloquea automáticamente la postulación a las 23:59:59 del día de cierre indicado en la convocatoria. No se podrán realizar excepciones ya que los plazos están firmados criptográficamente.",
            "Asegúrate de que la línea de investigación seleccionada en tu propuesta esté habilitada en los términos específicos de la convocatoria para evitar descalificaciones automáticas."
        ]
    }
};

interface LayoutMockupProps {
    highlight: 'sidebar' | 'topbar' | 'content-top' | 'content-bottom' | 'all' | 'none';
    stepTitle: string;
    pathname: string;
}

const LayoutMockup: React.FC<LayoutMockupProps> = ({ highlight, stepTitle, pathname }) => {
    // Determine pointer positions dynamically based on highlight target area and pathname
    const getPointerStyle = () => {
        switch (highlight) {
            case 'sidebar':
                return { left: '12%', top: '55%' };
            case 'topbar':
                return { left: '60%', top: '15%' };
            case 'content-top':
                return { left: '55%', top: '35%' };
            case 'content-bottom':
                return { left: '55%', top: '65%' };
            case 'all':
                return { left: '50%', top: '50%' };
            default:
                return null;
        }
    };

    const pointerPos = getPointerStyle();

    // Dynamically render the page mockup content based on pathname
    const renderContentMockup = () => {
        const isHighlightTop = highlight === 'content-top';
        const isHighlightBottom = highlight === 'content-bottom';
        const highlightTopClass = isHighlightTop ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' : 'border-border-thin bg-surface';
        const highlightBottomClass = isHighlightBottom ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)] border-2' : 'border-border-thin bg-surface';

        switch (pathname) {
            case '/dashboard':
                return (
                    <>
                        {/* Upper Stats / KPIs */}
                        <div className="grid grid-cols-3 gap-1.5 shrink-0">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 ${highlightTopClass}`}>
                                    <div className="w-2/3 h-1.5 bg-text-dim/20 rounded" />
                                    <div className="w-1/2 h-3.5 bg-text-main/30 rounded" />
                                </div>
                            ))}
                        </div>
                        {/* Bento Grid layout */}
                        <div className="flex-1 flex gap-1.5 min-h-0">
                            {/* Left Bento: Chart mockup */}
                            <div className={`flex-[1.2] rounded-lg border p-2 flex flex-col justify-between transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-1/2 h-2 bg-text-main/20 rounded" />
                                <div className="flex items-end gap-1 h-12 pt-2">
                                    <div className="w-1/4 h-3/5 bg-brand/40 rounded-sm" />
                                    <div className="w-1/4 h-4/5 bg-brand/60 rounded-sm animate-pulse" />
                                    <div className="w-1/4 h-2/5 bg-brand/30 rounded-sm" />
                                    <div className="w-1/4 h-full bg-brand rounded-sm" />
                                </div>
                            </div>
                            {/* Right Bento: Actions quicklist */}
                            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-3/4 h-2 bg-text-main/15 rounded" />
                                <div className="space-y-1 flex-1 py-1">
                                    <div className="w-full h-3.5 bg-text-dim/10 rounded-md border border-border-thin flex items-center justify-center text-[7px] text-text-dim">Crear</div>
                                    <div className="w-full h-3.5 bg-text-dim/10 rounded-md border border-border-thin flex items-center justify-center text-[7px] text-text-dim">Informe</div>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case '/investigacion':
            case '/investigacion/mis-proyectos':
                return (
                    <>
                        {/* Projects active button & Search */}
                        <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                            <div className="w-1/3 h-5 bg-brand/85 rounded-md flex items-center justify-center text-[7px] font-black text-white">Nuevo Proyecto</div>
                        </div>
                        {/* Projects list table and detail panel split */}
                        <div className="flex-1 flex gap-1.5 min-h-0">
                            {/* Projects Table */}
                            <div className={`flex-[1.5] rounded-lg border p-2 flex flex-col gap-1 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="flex justify-between border-b border-border-thin/40 pb-1 text-[7px] text-text-dim">
                                    <span className="w-1/2">Título</span>
                                    <span>Estado</span>
                                </div>
                                <div className="space-y-1 flex-1 py-1">
                                    <div className="flex justify-between items-center py-0.5">
                                        <div className="w-12 h-1.5 bg-text-main/20 rounded" />
                                        <div className="w-8 h-2.5 rounded-full bg-success/20 border border-success/30" />
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                        <div className="w-14 h-1.5 bg-text-main/20 rounded" />
                                        <div className="w-8 h-2.5 rounded-full bg-warning/20 border border-warning/30" />
                                    </div>
                                </div>
                            </div>
                            {/* Detail Panel */}
                            <div className={`w-[35%] rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-full h-1.5 bg-text-main/30 rounded" />
                                <div className="w-4/5 h-1 bg-text-dim/10 rounded" />
                                <div className="flex-1 border border-dashed border-border-thin rounded-sm mt-1 flex items-center justify-center text-[6px] text-text-dim">Detalle</div>
                            </div>
                        </div>
                    </>
                );

            case '/usuarios':
                return (
                    <>
                        {/* Filters & creation button */}
                        <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                            <div className="w-1/4 h-5 bg-brand/85 rounded-md flex items-center justify-center text-[7px] font-black text-white">Nuevo Externo</div>
                        </div>
                        {/* Users Table */}
                        <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                            <div className="flex justify-between border-b border-border-thin/40 pb-1 text-[7px] text-text-dim">
                                <span className="w-1/3">Usuario</span>
                                <span className="w-1/4">Roles</span>
                                <span>Acción</span>
                            </div>
                            <div className="space-y-1 flex-1 py-1">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex justify-between items-center py-0.5 border-b border-border-thin/20">
                                        <div className="w-10 h-1.5 bg-text-main/20 rounded" />
                                        <div className="w-12 h-2.5 bg-text-dim/10 rounded-sm border border-border-thin" />
                                        <div className="w-3.5 h-3.5 rounded bg-brand/20 border border-brand/40" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case '/auditoria':
                return (
                    <>
                        {/* Filters and export button */}
                        <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                            <div className="w-1/4 h-5 bg-text-main/20 rounded-md border border-border-thin flex items-center justify-center text-[6px] text-text-dim">Exportar</div>
                        </div>
                        {/* Log list vs Diff comparison split */}
                        <div className="flex-1 flex gap-1.5 min-h-0">
                            {/* Log list */}
                            <div className={`flex-[1.2] rounded-lg border p-2 flex flex-col gap-1 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-1/2 h-1.5 bg-text-dim/30 rounded" />
                                <div className="space-y-1 py-1 flex-1">
                                    <div className="w-full h-3 bg-text-main/15 rounded-sm" />
                                    <div className="w-full h-3 bg-text-dim/10 rounded-sm" />
                                </div>
                            </div>
                            {/* Diff panel */}
                            <div className={`flex-1 rounded-lg border p-1.5 flex flex-col gap-1 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-3/4 h-2 bg-text-main/20 rounded" />
                                <div className="flex-1 grid grid-cols-2 gap-1 mt-1">
                                    <div className="bg-error/15 border border-error/20 rounded p-0.5 flex flex-col justify-center"><div className="w-full h-1 bg-error/30 rounded" /></div>
                                    <div className="bg-success/15 border border-success/20 rounded p-0.5 flex flex-col justify-center"><div className="w-full h-1 bg-success/30 rounded" /></div>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case '/configuracion':
                return (
                    <>
                        {/* Settings sub-tabs */}
                        <div className="flex gap-1 shrink-0">
                            {['Líneas', 'Períodos', 'Metas'].map((tab, idx) => (
                                <div key={idx} className="w-12 h-4 rounded-t bg-text-dim/10 border border-b-0 border-border-thin flex items-center justify-center text-[6px] text-text-dim font-bold">{tab}</div>
                            ))}
                        </div>
                        {/* Config elements */}
                        <div className={`flex-1 rounded-lg rounded-tl-none border p-2.5 flex flex-col gap-2 transition-all duration-300 ${highlightBottomClass}`}>
                            <div className="w-1/2 h-2 bg-text-main/20 rounded" />
                            <div className="space-y-1.5 flex-1">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                                    <div className="w-1/2 h-3 bg-text-dim/10 rounded" />
                                </div>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                                    <div className="w-1/2 h-3 bg-text-dim/10 rounded" />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case '/analiticas':
                return (
                    <>
                        {/* Top controls */}
                        <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-1/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                            <div className="w-1/5 h-5 bg-brand/10 border border-brand/20 rounded flex items-center justify-center text-[6px] text-brand font-bold">PDF</div>
                        </div>
                        {/* Charts panel */}
                        <div className={`flex-1 rounded-lg border p-2 flex gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                            {/* Donut chart mockup */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-1 border border-border-thin/40 rounded p-1 bg-surface-hover/30">
                                <div className="w-7 h-7 rounded-full border-4 border-brand border-r-transparent animate-spin-slow" />
                                <div className="w-10 h-1 bg-text-dim/20 rounded" />
                            </div>
                            {/* Bar charts mockup */}
                            <div className="flex-1 flex items-end gap-1 border border-border-thin/40 rounded p-1.5 justify-center">
                                <div className="w-2.5 h-1/3 bg-success/60 rounded-t-sm" />
                                <div className="w-2.5 h-2/3 bg-brand/60 rounded-t-sm" />
                                <div className="w-2.5 h-full bg-brand/80 rounded-t-sm animate-pulse" />
                            </div>
                        </div>
                    </>
                );

            case '/notificaciones':
                return (
                    <>
                        {/* Top Category tabs */}
                        <div className={`h-7 rounded-lg border px-1.5 flex items-center gap-1 transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-8 h-3.5 rounded bg-brand/10 border border-brand/20 text-[6px] text-brand flex items-center justify-center font-bold">Inbox</div>
                            <div className="w-8 h-3.5 rounded bg-text-dim/5 text-[6px] text-text-dim flex items-center justify-center">Leídas</div>
                        </div>
                        {/* List */}
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
                );

            case '/verify':
                return (
                    <>
                        {/* Big Search Input */}
                        <div className={`h-8 rounded-lg border px-2 flex items-center justify-between transition-all duration-300 shrink-0 ${highlightTopClass}`}>
                            <div className="w-2/3 h-3 bg-text-dim/15 rounded border border-border-thin" />
                            <div className="w-1/5 h-5 bg-brand text-white rounded flex items-center justify-center text-[7px] font-black">Validar</div>
                        </div>
                        {/* Scanner / Result card */}
                        <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-2 justify-center items-center transition-all duration-300 ${highlightBottomClass}`}>
                            <div className="w-12 h-12 border-2 border-brand/50 border-dashed rounded-lg flex items-center justify-center relative bg-brand/5">
                                <div className="absolute inset-x-2 h-[1px] bg-brand animate-bounce" />
                                <div className="w-8 h-8 bg-text-dim/10 rounded-sm" />
                            </div>
                            <div className="w-20 h-2 bg-success/20 border border-success/30 rounded text-[6px] text-success text-center">Documento Auténtico</div>
                        </div>
                    </>
                );

            case '/revisiones':
            case '/arbitraje':
                return (
                    <>
                        {/* Peer review workspace */}
                        <div className="flex-1 flex gap-1.5 min-h-0">
                            {/* Left Side: Document View */}
                            <div className={`flex-1 rounded-lg border p-2 flex flex-col gap-1 transition-all duration-300 ${highlightTopClass}`}>
                                <div className="w-1/2 h-2 bg-text-main/30 rounded mb-1" />
                                <div className="space-y-1.5 flex-1 border border-border-thin bg-surface-hover/30 rounded p-1">
                                    <div className="w-full h-1 bg-text-dim/10 rounded" />
                                    <div className="w-11/12 h-1 bg-text-dim/10 rounded" />
                                </div>
                            </div>
                            {/* Right Side: Evaluation Rubric details */}
                            <div className={`flex-[0.9] rounded-lg border p-2 flex flex-col gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                                <div className="w-2/3 h-1.5 bg-text-main/20 rounded" />
                                {/* Rubric stars */}
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => <div key={s} className="w-1.5 h-1.5 rounded-full bg-amber-400" />)}
                                </div>
                                {/* Audio comment block */}
                                <div className="h-4 rounded bg-brand/10 border border-brand/20 flex items-center px-1 gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse" />
                                    <div className="w-8 h-1 bg-brand/35 rounded" />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case '/convocatorias':
                return (
                    <>
                        {/* Main active convocatorias card grid */}
                        <div className={`flex-1 grid grid-cols-2 gap-1.5 transition-all duration-300 ${highlightBottomClass}`}>
                            {[1, 2].map((i) => (
                                <div key={i} className="rounded-lg border p-1.5 flex flex-col justify-between bg-surface border-border-thin">
                                    <div className="space-y-1">
                                        <div className="w-4/5 h-2 bg-text-main/20 rounded" />
                                        <div className="w-full h-1 bg-text-dim/10 rounded" />
                                    </div>
                                    <div className="w-full h-3.5 bg-brand text-white rounded flex items-center justify-center text-[5px] font-black mt-2">Postular</div>
                                </div>
                            ))}
                        </div>
                    </>
                );

            default:
                return (
                    <>
                        {/* Default Stats / KPI cards */}
                        <div className={`grid grid-cols-3 gap-1.5 shrink-0 transition-all duration-300 ${highlightTopClass}`}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="rounded-lg border p-1 flex flex-col gap-1">
                                    <div className="w-2/3 h-1.5 bg-text-dim/20 rounded" />
                                    <div className="w-1/2 h-3.5 bg-text-main/30 rounded" />
                                </div>
                            ))}
                        </div>
                        {/* Default Lower Main Panel */}
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
                );
        }
    };

    return (
        <div className="relative w-full max-w-[420px] aspect-[16/10] bg-bg-deep/40 border border-border-thin rounded-2xl p-2.5 shadow-inner select-none transition-all duration-300">
            {/* Inner Mockup grid layout representing DIITRA */}
            <div className={`w-full h-full flex flex-col gap-1.5 rounded-xl overflow-hidden p-1.5 transition-all duration-300 ${
                highlight === 'all' 
                    ? 'border-2 border-brand shadow-[0_0_15px_rgba(0,112,243,0.35)] bg-brand/5' 
                    : 'border border-border-thin'
            }`}>
                
                {/* Simulated TopBar */}
                <div className={`h-8 border rounded-lg px-2 flex items-center justify-between transition-all duration-300 ${
                    highlight === 'topbar' 
                        ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' 
                        : 'border-border-thin bg-surface'
                }`}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-border-hover" />
                        <div className="w-12 h-2 rounded bg-text-dim/20" />
                    </div>
                    {/* Simulated Page Title Center */}
                    <div className="w-20 h-2 bg-text-main/20 rounded hidden xs:block" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-8 h-3 rounded bg-text-dim/15 border border-border-thin" />
                        <div className="w-4 h-4 rounded-full bg-text-dim/20" />
                    </div>
                </div>

                {/* Simulated Body Grid */}
                <div className="flex-1 flex gap-1.5 min-h-0">
                    
                    {/* Simulated Sidebar */}
                    <div className={`w-[22%] rounded-lg border p-1 flex flex-col justify-between transition-all duration-300 ${
                        highlight === 'sidebar' 
                            ? 'border-brand bg-brand/10 shadow-[0_0_12px_rgba(0,112,243,0.3)]' 
                            : 'border-border-thin bg-surface'
                    }`}>
                        <div className="space-y-1.5">
                            {/* Logo */}
                            <div className="w-8 h-2.5 bg-brand/35 rounded-sm mx-auto mb-2" />
                            {/* Items */}
                            <div className="w-full h-2 bg-text-main/15 rounded-sm" />
                            <div className="w-4/5 h-2 bg-text-dim/10 rounded-sm" />
                            <div className="w-full h-2 bg-text-dim/10 rounded-sm" />
                            <div className="w-3/5 h-2 bg-text-dim/10 rounded-sm" />
                        </div>
                        <div className="w-full h-2.5 bg-text-dim/20 rounded-sm" />
                    </div>

                    {/* Simulated Main Content Workspace */}
                    <div className="flex-1 flex flex-col gap-1.5 min-h-0">
                        {renderContentMockup()}
                    </div>
                </div>
            </div>

            {/* Glowing Pointer Arrow & Tooltip Onboarding Indicator */}
            {pointerPos && (
                <div 
                    style={{ left: pointerPos.left, top: pointerPos.top }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-500 ease-out"
                >
                    {/* Ring Pointer pulse */}
                    <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-brand opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand border border-white shadow-md"></span>
                    </div>

                    {/* Floating Info Tag under the pointer */}
                    <div className="mt-1 bg-brand text-[8px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 rounded shadow-lg border border-brand-light whitespace-nowrap animate-fade-in">
                        {stepTitle}
                    </div>

                    {/* SVG Connector Arrow pointing to highlight */}
                    <svg className="w-4 h-4 text-brand -mt-1.5 fill-current animate-bounce" viewBox="0 0 20 20">
                        <path d="M10 5l-5 6h10l-5-6z" />
                    </svg>
                </div>
            )}
        </div>
    );
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

    // Calculate active highlight zone for the mockup
    const getActiveHighlight = () => {
        if (currentStep === 0) return 'all';
        if (currentStep === totalSteps - 1) return 'none';
        const stepIdx = currentStep - 1;
        return config.steps[stepIdx]?.highlight || 'none';
    };

    // Get active step label for mockup tooltip
    const getActiveStepLabel = () => {
        if (currentStep === 0) return 'Módulo General';
        if (currentStep === totalSteps - 1) return 'Cumplimiento';
        return `Paso ${currentStep}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <div 
                className="absolute inset-0 bg-bg-deep/75 backdrop-blur-md cursor-pointer animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Dialog Card (Scaled to max-w-3xl for SharePoint Onboarding mockup) */}
            <div className="relative w-full max-w-3xl bg-surface border border-border-thin rounded-2xl shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-thin bg-surface shrink-0">
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

                {/* Two-Column Body Grid (Side-by-side on desktop, vertical stack on mobile) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[380px] flex flex-col md:flex-row border-b border-border-thin">
                    
                    {/* Left Column: Explanations & Text Wizard (45% width on desktop) */}
                    <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-thin">
                        <div 
                            key={currentStep}
                            className={`flex-1 flex flex-col justify-center ${
                                direction === 'next' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
                            }`}
                        >
                            {currentStep === 0 && (
                                /* Step 0: Overview & Summary */
                                <div className="space-y-4 py-2">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center text-brand shadow-inner animate-pulse">
                                        {config.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-brand">
                                            Introducción
                                        </span>
                                        <h4 className="text-sm font-black uppercase tracking-wider text-text-main">
                                            {config.title}
                                        </h4>
                                    </div>
                                    <p className="text-[11.5px] font-bold text-text-main leading-snug">
                                        {config.summary}
                                    </p>
                                    <p className="text-[11px] text-text-dim leading-relaxed font-medium">
                                        {config.description}
                                    </p>
                                </div>
                            )}

                            {currentStep > 0 && currentStep <= config.steps.length && (() => {
                                const stepIdx = currentStep - 1;
                                const step = config.steps[stepIdx];
                                return (
                                    /* Step 1 to N: Sequential Instructions */
                                    <div className="space-y-4 py-2">
                                        <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-mono font-black text-brand">
                                            {currentStep}
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-brand">
                                                Paso {currentStep} de {config.steps.length}
                                            </span>
                                            <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                                                {step.title}
                                            </h4>
                                        </div>
                                        <p className="text-[11.5px] text-text-dim leading-relaxed font-medium">
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })()}

                            {currentStep === totalSteps - 1 && (
                                /* Final Step: Compliance & Quick Tips */
                                <div className="space-y-5 py-2">
                                    {/* Compliance Banner */}
                                    <div className="p-3.5 rounded-xl bg-brand/5 border border-brand/10 flex items-start gap-3">
                                        <div className="p-1.5 bg-brand/10 rounded-lg text-brand shrink-0">
                                            <Award size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-text-main">
                                                Cumplimiento CACES
                                            </h5>
                                            <p className="text-[10px] text-text-dim leading-relaxed font-medium">
                                                {config.compliance}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tips list */}
                                    <div className="space-y-2">
                                        <h5 className="text-[8px] font-black uppercase tracking-widest text-text-dim border-b border-border-thin pb-1">
                                            Accesibilidad y Consejos
                                        </h5>
                                        <ul className="space-y-2">
                                            {config.tips.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[10px] text-text-dim leading-relaxed font-medium">
                                                    <Zap size={10} className="text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Interactive UI Mockup Simulator (55% width on desktop) */}
                    <div className="w-full md:w-[55%] p-6 md:p-8 bg-bg-deep/10 flex flex-col justify-center items-center select-none">
                        <LayoutMockup 
                            highlight={getActiveHighlight()} 
                            stepTitle={getActiveStepLabel()}
                            pathname={pathname}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-border-thin bg-surface/50 flex items-center justify-between shrink-0">
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
                        <span>Atrás</span>
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
