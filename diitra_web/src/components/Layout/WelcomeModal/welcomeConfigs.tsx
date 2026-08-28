import type { RoleWelcomeConfig } from './types';

export const ADMIN_WELCOME: RoleWelcomeConfig = {
    role: 'admin',
    roleLabel: 'Administrador del Ecosistema',
    greeting: 'Bienvenido al Centro de Mando Institucional',
    subtitle: 'Supervisión ejecutiva de proyectos, ciclo de vida documental y gobernanza integral del DIITRA.',
    modules: [
        {
            id: 'analiticas',
            title: 'Analíticas y KPIs',
            summary: 'Supervisión integral de proyectos, ejecución presupuestaria y cumplimiento de estándares CACES.',
            badge: 'Mando',
            details: {
                headline: 'Supervisión Estratégica Institucional',
                summaryTitle: 'Resumen Institucional',
                summaryRows: [
                    { label: 'Proyectos Activos', value: '14 vigentes', statusColor: 'emerald' },
                    { label: 'Investigadores Activos', value: '10 miembros', statusColor: 'blue' },
                    { label: 'Productos Científicos', value: '2 validados', statusColor: 'emerald' },
                    { label: 'Ejecución Presupuestaria', value: '100%', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Monitoreo de Proyectos I+D',
                        description: 'Seguimiento en tiempo real de propuestas en fase de borrador, evaluación y acreditación final.',
                        tag: 'Control'
                    },
                    {
                        title: 'Ejecución Financiera',
                        description: 'Control de partidas presupuestarias asignadas a convocatorias internas e innovación aplicada.',
                        tag: 'Finanzas'
                    }
                ],
                footerNote: 'Módulo optimizado para comités directivos y auditorías CACES.'
            }
        },
        {
            id: 'documentos',
            title: 'Gestión Documental',
            summary: 'Administración de plantillas oficiales, flujos de aprobación y resguardo de versiones institucionales.',
            badge: 'Documentos',
            details: {
                headline: 'Ciclo de Vida Documental Normativo',
                summaryTitle: 'Resumen de Plantillas y Firmas',
                summaryRows: [
                    { label: 'Plantillas Oficiales', value: '6 vigentes', statusColor: 'emerald' },
                    { label: 'Firmas Digitales Activas', value: '100% validadas', statusColor: 'emerald' },
                    { label: 'Versión Normativa', value: 'v2.4 ISTPET', statusColor: 'blue' }
                ],
                actionPoints: [
                    {
                        title: 'Plantillas Maestras Universales',
                        description: 'Configuración de formatos institucionales para planes bienales, informes semestrales y rúbricas.',
                        tag: 'Formatos'
                    },
                    {
                        title: 'Aprobaciones con Firma Electrónica',
                        description: 'Flujo estructurado de validación de documentos con certificado criptográfico oficial.',
                        tag: 'Firmas'
                    }
                ],
                footerNote: 'Formatos homologados según normativa institucional 2026.'
            }
        },
        {
            id: 'auditoria',
            title: 'Auditoría y LOPDP',
            summary: 'Trazabilidad criptográfica de eventos, protección de datos personales y gestión de derechos ARCO.',
            badge: 'Seguridad',
            details: {
                headline: 'Seguridad Forense y Cumplimiento Legal',
                summaryTitle: 'Trazabilidad y Privacidad',
                summaryRows: [
                    { label: 'Cumplimiento LOPDP', value: '100% conforme', statusColor: 'emerald' },
                    { label: 'Integridad Criptográfica', value: 'SHA-256 válida', statusColor: 'emerald' },
                    { label: 'Incidentes Detectados', value: '0 alertas', statusColor: 'neutral' }
                ],
                actionPoints: [
                    {
                        title: 'Registro Forense de Auditoría',
                        description: 'Auditoría inmutable de accesos, modificaciones de estado, firmas estampadas y descargas.',
                        tag: 'Auditoría'
                    },
                    {
                        title: 'Derechos ARCO y Privacidad',
                        description: 'Gestión formal de solicitudes de acceso, rectificación, cancelación y oposición de datos.',
                        tag: 'LOPDP'
                    }
                ],
                footerNote: 'Alineado con la Ley Orgánica de Protección de Datos Personales.'
            }
        },
        {
            id: 'gobernanza',
            title: 'Gobernanza y Roles',
            summary: 'Administración de usuarios, asignación de permisos, baremos normativos y convocatorias institucionales.',
            badge: 'Gobernanza',
            details: {
                headline: 'Parametrización del Ecosistema',
                summaryTitle: 'Comunidad Académica DIITRA',
                summaryRows: [
                    { label: 'Docentes Investigadores', value: '32 activos', statusColor: 'emerald' },
                    { label: 'Estudiantes en Semilleros', value: '120 vinculados', statusColor: 'blue' },
                    { label: 'Revisores Pares Externos', value: '8 evaluadores', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Control de Accesos RBAC',
                        description: 'Asignación granular de roles y facultades para docentes, estudiantes, revisores y directivos.',
                        tag: 'Permisos'
                    },
                    {
                        title: 'Baremos y Líneas de Investigación',
                        description: 'Configuración de baremos cuantitativos CACES y áreas temáticas por carrera institucional.',
                        tag: 'Baremos'
                    }
                ],
                footerNote: 'Gobernanza alineada con el Plan Estratégico de Desarrollo Institucional.'
            }
        }
    ],
    primaryActionLabel: 'Ingresar al Panel',
    secondaryActionLabel: 'Ver Guía del Sistema'
};

export const DOCENTE_WELCOME: RoleWelcomeConfig = {
    role: 'docente',
    roleLabel: 'Docente Investigador',
    greeting: 'Bienvenido a tu Espacio Científico',
    subtitle: 'La plataforma unificada para formular proyectos en tiempo real, monitorear tu carga horaria y respaldar evidencias CACES.',
    modules: [
        {
            id: 'workspace',
            title: 'Workspace Colaborativo',
            summary: 'Redacción en tiempo real con co-autores, matrices de coherencia y plantillas oficiales normativas.',
            badge: 'Colaboración',
            details: {
                headline: 'Co-autoría en Tiempo Real y Metodología',
                summaryTitle: 'Estado de Producción del Periodo',
                summaryRows: [
                    { label: 'Proyectos Activos', value: '1 en desarrollo', statusColor: 'emerald' },
                    { label: 'Co-autores Conectados', value: '3 miembros', statusColor: 'blue' },
                    { label: 'Sincronización en Vivo', value: 'Yjs WebSockets', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Edición Simultánea con Colegas',
                        description: 'Trabaja en la misma propuesta científica con co-autores con cursores en vivo y sin bloqueos.',
                        tag: 'En Vivo'
                    },
                    {
                        title: 'Matriz de Coherencia Integrada',
                        description: 'Alineación guiada de problemas, objetivos, metodología, resultados y presupuesto.',
                        tag: 'Metodología'
                    }
                ],
                footerNote: 'Tus avances se sincronizan y resguardan de forma automática.'
            }
        },
        {
            id: 'distributivo',
            title: 'Distributivo y Horas',
            summary: 'Monitoreo de horas asignadas a investigación científica, cronograma de hitos y sincronización SIGAFI.',
            badge: 'Distributivo',
            details: {
                headline: 'Control de Carga Horaria y Dedicación',
                summaryTitle: 'Resumen del Periodo',
                summaryRows: [
                    { label: 'Mis Proyectos Activos', value: '1 proyecto', statusColor: 'emerald' },
                    { label: 'Horas de Investigación', value: '7 hrs / sem', statusColor: 'emerald' },
                    { label: 'Informes Pendientes', value: '1 por entregar', statusColor: 'amber' }
                ],
                actionPoints: [
                    {
                        title: 'Horas Semanales Asignadas',
                        description: 'Visualización clara de tu tiempo lectivo y no lectivo destinado al desarrollo científico.',
                        tag: 'Horas'
                    },
                    {
                        title: 'Hitos y Entregables',
                        description: 'Planificación de entregas intermedias, informes de avance y defensas de proyecto.',
                        tag: 'Calendario'
                    }
                ],
                footerNote: 'Sincronizado directamente con las bases académicas SIGAFI.'
            }
        },
        {
            id: 'grupos',
            title: 'Grupos y Semilleros',
            summary: 'Administración de líneas temáticas de investigación, formulación de planes bienales e integración de tesistas.',
            badge: 'Semilleros',
            details: {
                headline: 'Liderazgo de Grupos y Formación de Talento',
                summaryTitle: 'Resumen de Grupo Científico',
                summaryRows: [
                    { label: 'Líneas de Investigación', value: '4 acreditadas', statusColor: 'emerald' },
                    { label: 'Tesistas Asignados', value: '6 estudiantes', statusColor: 'blue' },
                    { label: 'Plan Bienal', value: '2026-2027 vigente', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Dirección de Grupos de Investigación',
                        description: 'Gestión de los miembros docentes, líneas de acción y producción científica anual del colectivo.',
                        tag: 'Grupos'
                    },
                    {
                        title: 'Vinculación de Estudiantes',
                        description: 'Incorpora tesistas y estudiantes de semillero para cumplir horas formativas en tus proyectos.',
                        tag: 'Estudiantes'
                    }
                ],
                footerNote: 'Fortalece la investigación formativa y la acreditación de la carrera.'
            }
        },
        {
            id: 'caces',
            title: 'Informes CACES',
            summary: 'Formularios estructurados para informes de avance técnico y financiero con trazabilidad a criterios CACES.',
            badge: 'Acreditación',
            details: {
                headline: 'Evidencias y Cumplimiento Normativo',
                summaryTitle: 'Acreditación CACES',
                summaryRows: [
                    { label: 'Criterio CACES Asignado', value: 'B.1.2 Conforme', statusColor: 'emerald' },
                    { label: 'Informe Técnico Semestral', value: 'Aprobado', statusColor: 'emerald' },
                    { label: 'Auditoría Institucional', value: '100% Conforme', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Informes Técnicos Semestrales',
                        description: 'Generación ágil de reportes de avance con gráficos, anexos y actas de reunión.',
                        tag: 'Informes'
                    },
                    {
                        title: 'Rendición de Fondos y Gastos',
                        description: 'Justificación financiera de insumos, equipos y publicaciones financiadas por convocatorias.',
                        tag: 'Finanzas'
                    }
                ],
                footerNote: 'Evidencias listas para procesos de acreditación y auditoría de calidad.'
            }
        }
    ],
    primaryActionLabel: 'Comenzar a Investigar',
    secondaryActionLabel: 'Ver Guía del Docente'
};

export const ESTUDIANTE_WELCOME: RoleWelcomeConfig = {
    role: 'estudiante',
    roleLabel: 'Estudiante / Semillero',
    greeting: 'Bienvenido a tu Portal de Investigación',
    subtitle: 'El espacio oficial para colaborar en proyectos científicos, vincularte a grupos y certificar tus horas de titulación.',
    modules: [
        {
            id: 'grupos',
            title: 'Directorio de Semilleros',
            summary: 'Explora las líneas de investigación activas de tu carrera y postula para colaborar en grupos tutelados.',
            badge: 'Oportunidades',
            details: {
                headline: 'Convocatorias de Semillero y Tesis',
                summaryTitle: 'Oportunidades Académicas',
                summaryRows: [
                    { label: 'Grupos Disponibles', value: '8 por carrera', statusColor: 'emerald' },
                    { label: 'Proyectos con Vacantes', value: '12 activos', statusColor: 'blue' },
                    { label: 'Modalidad de Tutoría', value: 'Docentes ISTPET', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Catálogo de Grupos Científicos',
                        description: 'Revisa las áreas temáticas de tu carrera: Software, Energías, Automatización o Administración.',
                        tag: 'Líneas'
                    },
                    {
                        title: 'Postulación a Proyectos',
                        description: 'Envía tu solicitud para integrarte como asistente de investigación en proyectos docentes vigentes.',
                        tag: 'Postular'
                    }
                ],
                footerNote: 'Desarrolla competencias científicas y técnicas de alto nivel.'
            }
        },
        {
            id: 'horas',
            title: 'Horas de Titulación',
            summary: 'Certificación digital y registro de horas de investigación formativa válidas para tu graduación.',
            badge: 'Titulación',
            details: {
                headline: 'Acreditación y Certificación de Horas',
                summaryTitle: 'Progreso de Titulación',
                summaryRows: [
                    { label: 'Horas Acreditadas', value: '80 horas', statusColor: 'emerald' },
                    { label: 'Meta de Titulación', value: '120 horas', statusColor: 'blue' },
                    { label: 'Avance Porcentual', value: '66.7% completado', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Registro de Actividades',
                        description: 'Bitácora de tareas de campo, pruebas piloto y desarrollo técnico respaldado por tu tutor.',
                        tag: 'Bitácora'
                    },
                    {
                        title: 'Certificado Institucional',
                        description: 'Descarga tu constancia oficial con código QR para el expediente de grado.',
                        tag: 'Certificado'
                    }
                ],
                footerNote: 'Tus horas quedan legalmente acreditadas ante secretaría académica.'
            }
        },
        {
            id: 'workspace',
            title: 'Espacio Asistido',
            summary: 'Accede a plantillas normativas oficiales del instituto y redacta tus avances con retroalimentación del tutor.',
            badge: 'Plantillas',
            details: {
                headline: 'Redacción Asistida y Tutoría',
                summaryTitle: 'Entregables del Proyecto',
                summaryRows: [
                    { label: 'Formato Normativo', value: 'ISTPET 2026', statusColor: 'emerald' },
                    { label: 'Tutoría Asignada', value: 'En Línea', statusColor: 'blue' },
                    { label: 'Avances Revisados', value: '3 capítulos', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Plantillas Oficiales de Tesis',
                        description: 'Estructuras listas con portada institucional, formato APA 7ma edición y secciones metodológicas.',
                        tag: 'Formato'
                    },
                    {
                        title: 'Comentarios del Docente Director',
                        description: 'Recibe correcciones y sugerencias directamente en las secciones de tu trabajo.',
                        tag: 'Tutoría'
                    }
                ],
                footerNote: 'Garantiza el cumplimiento de los estándares de titulación institucional.'
            }
        }
    ],
    primaryActionLabel: 'Explorar Oportunidades',
    secondaryActionLabel: 'Ver Guía del Estudiante'
};

export const REVISOR_WELCOME: RoleWelcomeConfig = {
    role: 'revisor',
    roleLabel: 'Revisor Par Evaluador',
    greeting: 'Bienvenido al Panel de Arbitraje Científico',
    subtitle: 'Plataforma confidencial y rigurosa para la evaluación técnica, metodológica y presupuestaria de propuestas.',
    modules: [
        {
            id: 'evaluacion',
            title: 'Rúbricas CACES',
            summary: 'Calificación cuantitativa de rigor metodológico, pertinencia, viabilidad e impacto científico.',
            badge: 'Rúbricas',
            details: {
                headline: 'Evaluación Cuantitativa Ponderada',
                summaryTitle: 'Resumen de Rúbrica',
                summaryRows: [
                    { label: 'Escala de Calificación', value: 'Sobre 100 puntos', statusColor: 'emerald' },
                    { label: 'Estándar Normativo', value: 'Criterios CACES', statusColor: 'blue' },
                    { label: 'Dictamen Oficial', value: 'Estructurado', statusColor: 'emerald' }
                ],
                actionPoints: [
                    {
                        title: 'Criterios Metodológicos',
                        description: 'Evaluación de planteamiento del problema, hipótesis, diseño experimental y referencias científicas.',
                        tag: 'Metodología'
                    },
                    {
                        title: 'Viabilidad Presupuestaria',
                        description: 'Análisis de la coherencia entre actividades planificadas y recursos financieros solicitados.',
                        tag: 'Presupuesto'
                    }
                ],
                footerNote: 'Garantiza la imparcialidad y la calidad científica de las convocatorias.'
            }
        },
        {
            id: 'arbitraje',
            title: 'Arbitraje Doble Ciego',
            summary: 'Revisión técnica con estricta reserva de identidad de autores y trazabilidad transparente de dictámenes.',
            badge: 'Confidencial',
            details: {
                headline: 'Confidencialidad e Integridad Ética',
                summaryTitle: 'Panel de Dictamen',
                summaryRows: [
                    { label: 'Modalidad de Arbitraje', value: 'Doble Ciego', statusColor: 'emerald' },
                    { label: 'Firma Digital', value: 'Habilitada', statusColor: 'emerald' },
                    { label: 'Trazabilidad Forense', value: 'Inmutable', statusColor: 'blue' }
                ],
                actionPoints: [
                    {
                        title: 'Anonimato de Autores y Evaluadores',
                        description: 'Proceso blindado contra sesgos personales para asegurar la máxima objetividad académica.',
                        tag: 'Ética'
                    },
                    {
                        title: 'Emisión de Dictamen Formal',
                        description: 'Resoluciones formales estructuradas: Aprobado, Aprobado con Modificaciones, o No Aprobado.',
                        tag: 'Dictamen'
                    }
                ],
                footerNote: 'Tu evaluación respalda la toma de decisiones del comité científico.'
            }
        }
    ],
    primaryActionLabel: 'Ver Proyectos por Evaluar',
    secondaryActionLabel: 'Ver Criterios de Evaluación'
};

export const DEFAULT_WELCOME: RoleWelcomeConfig = {
    role: 'todos',
    roleLabel: 'Miembro de la Comunidad',
    greeting: 'Bienvenido al Ecosistema DIITRA',
    subtitle: 'La plataforma integral de investigación, desarrollo tecnológico y producción académica del Tecnológico Traversari.',
    modules: [
        {
            id: 'plataforma',
            title: 'Plataforma Científica',
            summary: 'Herramientas modernas para la formulación, seguimiento y acreditación de proyectos científicos.',
            badge: 'Ecosistema',
            details: {
                headline: 'Ecosistema de Investigación Aplicada',
                summaryTitle: 'Resumen Institucional',
                summaryRows: [
                    { label: 'Proyectos Activos', value: '14 vigentes', statusColor: 'emerald' },
                    { label: 'Investigadores', value: '32 docentes', statusColor: 'blue' }
                ],
                actionPoints: [
                    {
                        title: 'Investigación Aplicada',
                        description: 'Acceso a convocatorias institucionales, banco de proyectos y catálogo de grupos científicos.',
                        tag: 'Ciencia'
                    }
                ],
                footerNote: 'ISTPET — Tecnológico Traversari 2026.'
            }
        }
    ],
    primaryActionLabel: 'Comenzar Recorrido',
    secondaryActionLabel: 'Ver Guía del Sistema'
};

export const getWelcomeConfigByRole = (
    isAdmin: boolean,
    isDocente: boolean,
    isEstudiante: boolean,
    isRevisor: boolean
): RoleWelcomeConfig => {
    if (isAdmin) return ADMIN_WELCOME;
    if (isDocente) return DOCENTE_WELCOME;
    if (isEstudiante) return ESTUDIANTE_WELCOME;
    if (isRevisor) return REVISOR_WELCOME;
    return DEFAULT_WELCOME;
};
