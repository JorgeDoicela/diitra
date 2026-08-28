import type { RoleWelcomeConfig } from './types';

export const ADMIN_WELCOME: RoleWelcomeConfig = {
    role: 'admin',
    roleLabel: 'Administrador Institucional',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: 'DIITRA centraliza la investigación, desarrollo tecnológico e innovación del Tecnológico Traversari, asegurando la gobernanza científica, el cumplimiento normativo CACES y la preservación de la producción académica institucional.',
    sectionTitle: 'Ejes Estratégicos de Gestión Institucional',
    benefits: [
        {
            title: 'Investigación, Innovación y Banco de Proyectos',
            description: 'Supervisión del ciclo de vida de proyectos I+D, transferencia tecnológica, convocatorias con financiamiento y analíticas de producción científica.',
            tag: 'Investigación'
        },
        {
            title: 'Evaluación por Pares y Baremos CACES',
            description: 'Asignación de evaluadores ciegos, parametrización de rúbricas cuantitativas sobre 100 puntos y seguimiento de dictámenes formales.',
            tag: 'Evaluación'
        },
        {
            title: 'Ciclo Documental, Plantillas y Firmas',
            description: 'Gestión de plantillas maestras normativas, flujo de aprobaciones, firmas criptográficas y portal de verificación de autenticidad QR.',
            tag: 'Documentos'
        },
        {
            title: 'Gobernanza, Auditoría Forense y LOPDP',
            description: 'Administración de usuarios y permisos (RBAC), bitácora inmutable SHA-256, gestión de derechos ARCO y motor de notificaciones.',
            tag: 'Gobernanza'
        }
    ],
    primaryActionLabel: 'Comenzar'
};

export const DOCENTE_WELCOME: RoleWelcomeConfig = {
    role: 'docente',
    roleLabel: 'Docente Investigador',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: 'DIITRA es tu entorno de trabajo científico institucional. Aquí podrás formular proyectos con tus colegas en tiempo real, respaldar tu carga horaria ante SIGAFI y automatizar tus evidencias para los procesos de acreditación CACES.',
    sectionTitle: 'Ejes de Investigación y Docencia',
    benefits: [
        {
            title: 'Workspace Colaborativo en Tiempo Real',
            description: 'Co-autoría simultánea en vivo con colegas mediante cursores compartidos, matrices de coherencia metodológica y plantillas oficiales normativas.',
            tag: 'Colaboración'
        },
        {
            title: 'Proyectos de Innovación y Transferencia',
            description: 'Formulación de proyectos de prototipado tecnológico, vinculación con el sector productivo y registro de patentes ante el SENADI.',
            tag: 'Innovación'
        },
        {
            title: 'Control de Distributivo y Horas SIGAFI',
            description: 'Seguimiento automático de la carga horaria semanal lectiva y no lectiva asignada a investigación, con calendario unificado de hitos.',
            tag: 'Distributivo'
        },
        {
            title: 'Grupos, Planes Bienales y Acreditación',
            description: 'Dirección de grupos científicos, vinculación de tesistas y generación ágil de informes semestrales CACES con firma electrónica.',
            tag: 'Acreditación'
        }
    ],
    primaryActionLabel: 'Comenzar'
};

export const ESTUDIANTE_WELCOME: RoleWelcomeConfig = {
    role: 'estudiante',
    roleLabel: 'Estudiante / Semillero',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: 'DIITRA es el entorno oficial del instituto para impulsar tu formación científica. Aquí podrás vincularte a grupos de investigación de tu carrera, participar en proyectos reales y certificar tus horas de investigación para la titulación.',
    sectionTitle: 'Ejes de Formación y Titulación',
    benefits: [
        {
            title: 'Directorio y Postulación a Semilleros',
            description: 'Explora las líneas de investigación activas de tu carrera (Software, Energías, Automatización) y postula para colaborar en proyectos docentes.',
            tag: 'Semilleros'
        },
        {
            title: 'Acreditación de Horas de Titulación',
            description: 'Bitácora digital de horas prácticas de investigación formativa y descarga de constancias oficiales certificadas con código QR para graduación.',
            tag: 'Titulación'
        },
        {
            title: 'Espacio de Redacción con Tutoría en Línea',
            description: 'Redacta tu propuesta de grado con plantillas oficiales institucionales y recibe retroalimentación y correcciones directas de tu docente director.',
            tag: 'Plantillas'
        },
        {
            title: 'Portal de Verificación y Certificados',
            description: 'Acceso a la validación pública de autenticidad de tus constancias y participación en semilleros de investigación científica institucional.',
            tag: 'Verificación'
        }
    ],
    primaryActionLabel: 'Comenzar'
};

export const REVISOR_WELCOME: RoleWelcomeConfig = {
    role: 'revisor',
    roleLabel: 'Revisor Par Evaluador',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: 'DIITRA provee un entorno riguroso, confidencial y transparente para la evaluación técnica, metodológica y presupuestaria de propuestas de investigación científica institucional.',
    sectionTitle: 'Ejes de Arbitraje y Dictamen',
    benefits: [
        {
            title: 'Panel de Arbitraje Doble Ciego',
            description: 'Entorno confidencial y blindado con estricta reserva de identidades entre autores y evaluadores para garantizar absoluta objetividad.',
            tag: 'Confidencial'
        },
        {
            title: 'Evaluación Cuantitativa por Rúbricas CACES',
            description: 'Calificación ponderada sobre 100 puntos evaluando rigor metodológico, pertinencia institucional y coherencia presupuestaria.',
            tag: 'Rúbricas'
        },
        {
            title: 'Emisión de Dictámenes con Firma Digital',
            description: 'Emite resoluciones vinculantes (Aprobado, Aprobado con modificaciones, Rechazado) respaldadas con firma electrónica criptográfica.',
            tag: 'Dictámenes'
        },
        {
            title: 'Certificados Oficiales de Arbitraje',
            description: 'Generación automática de constancias institucionales con código QR verificable para respaldo de tu trayectoria científica.',
            tag: 'Certificados'
        }
    ],
    primaryActionLabel: 'Comenzar'
};

export const DEFAULT_WELCOME: RoleWelcomeConfig = {
    role: 'todos',
    roleLabel: 'Miembro de la Comunidad',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: 'DIITRA centraliza la investigación, desarrollo tecnológico y producción académica del Tecnológico Traversari.',
    sectionTitle: 'Módulos y Funciones Disponibles',
    benefits: [
        {
            title: 'Investigación Aplicada e Innovación',
            description: 'Consulta convocatorias abiertas, banco de proyectos institucionales y líneas de investigación por carrera.',
            tag: 'Ciencia'
        },
        {
            title: 'Acreditación y Calidad Académica',
            description: 'Acceso a normativas, formatos oficiales y respaldo de actividades de vinculación e investigación.',
            tag: 'Calidad'
        }
    ],
    primaryActionLabel: 'Comenzar'
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
