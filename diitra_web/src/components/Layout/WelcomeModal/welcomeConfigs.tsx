import type { RoleWelcomeConfig } from './types';

export const ADMIN_WELCOME: RoleWelcomeConfig = {
    role: 'admin',
    roleLabel: 'Administrador Institucional',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: '¡Qué gusto tenerte aquí! Desde este espacio lideras y potencias el crecimiento científico de nuestra comunidad. Cuentas con herramientas integrales para coordinar proyectos, velar por la excelencia académica y acompañar a nuestros investigadores en cada paso.',
    sectionTitle: '¿Qué deseas gestionar hoy?',
    benefits: [
        {
            title: 'Proyectos e Innovación I+D',
            description: 'Supervisa convocatorias, postulaciones y la producción científica institucional con total claridad y trazabilidad.',
            tag: 'Investigación',
            path: '/investigacion'
        },
        {
            title: 'Evaluación por Pares y Baremos',
            description: 'Asigna revisores ciegos y gestiona rúbricas CACES con procesos ágiles, transparentes y orientados a la calidad.',
            tag: 'Evaluación',
            path: '/evaluacion-pares'
        },
        {
            title: 'Ciclo Documental y Plantillas',
            description: 'Administra formatos oficiales, flujos de aprobación y emisión de constancias con firma digital y verificación QR.',
            tag: 'Documentos',
            path: '/admin/documentos'
        },
        {
            title: 'Gobernanza y Comunidad',
            description: 'Gestiona roles, accesos y seguridad de la información para brindar la mejor experiencia a docentes y estudiantes.',
            tag: 'Gobernanza',
            path: '/usuarios'
        }
    ],
    primaryActionLabel: 'Comenzar',
    primaryActionPath: '/investigacion'
};

export const DOCENTE_WELCOME: RoleWelcomeConfig = {
    role: 'docente',
    roleLabel: 'Docente Investigador',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: '¡Te damos la bienvenida a tu espacio de creación e investigación! Aquí puedes dar vida a tus proyectos, colaborar en vivo con tus colegas y semilleristas, y respaldar tu labor académica de forma simple y organizada.',
    sectionTitle: 'Espacios diseñados para tu labor',
    benefits: [
        {
            title: 'Espacio Colaborativo en Vivo',
            description: 'Escribe y estructura tus propuestas en tiempo real junto a tu equipo, con matrices metodológicas y plantillas oficiales.',
            tag: 'Colaboración',
            path: '/investigacion/mis-proyectos'
        },
        {
            title: 'Proyectos y Convocatorias',
            description: 'Formula ideas de innovación, prototipado y vinculación con la comunidad para participar en convocatorias abiertas.',
            tag: 'Innovación',
            path: '/investigacion'
        },
        {
            title: 'Planificación y Carga Horaria',
            description: 'Lleva el seguimiento tranquilo de tus horas dedicadas a investigación y las fechas clave de tus entregables.',
            tag: 'Planificación',
            path: '/investigacion/mis-proyectos'
        },
        {
            title: 'Grupos, Semilleros y Acreditación',
            description: 'Guía el talento de tus estudiantes, comparte avances y genera tus reportes para procesos CACES sin contratiempos.',
            tag: 'Comunidad',
            path: '/grupos'
        }
    ],
    primaryActionLabel: 'Comenzar',
    primaryActionPath: '/investigacion/mis-proyectos'
};

export const ESTUDIANTE_WELCOME: RoleWelcomeConfig = {
    role: 'estudiante',
    roleLabel: 'Estudiante / Semillero',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: '¡Bienvenido a tu entorno de investigación y aprendizaje! Este es el lugar donde tus ideas se transforman en proyectos reales. Participa junto a tus profesores, desarrolla tu potencial y prepárate con éxito para tu titulación.',
    sectionTitle: 'Oportunidades para explorar y crecer',
    benefits: [
        {
            title: 'Semilleros de Investigación',
            description: 'Únete a los grupos y líneas de investigación de tu carrera (Software, Energías, Automatización) y colabora en equipo.',
            tag: 'Semilleros',
            path: '/grupos'
        },
        {
            title: 'Tus Horas de Titulación',
            description: 'Registra tus avances en investigación formativa y obtén tus constancias oficiales certificadas para graduarte.',
            tag: 'Titulación',
            path: '/investigacion/mis-proyectos'
        },
        {
            title: 'Redacción con Asesoría Docente',
            description: 'Redacta tu propuesta académica con plantillas guía y recibe retroalimentación y correcciones oportunas de tu tutor.',
            tag: 'Asesoría',
            path: '/investigacion/mis-proyectos'
        },
        {
            title: 'Logros y Certificados Oficiales',
            description: 'Consulta y valida en cualquier momento la autenticidad de tus certificados y constancias con código QR.',
            tag: 'Certificados',
            path: '/verificacion'
        }
    ],
    primaryActionLabel: 'Comenzar',
    primaryActionPath: '/investigacion/mis-proyectos'
};

export const REVISOR_WELCOME: RoleWelcomeConfig = {
    role: 'revisor',
    roleLabel: 'Revisor Par Evaluador',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: '¡Agradecemos y valoramos tu colaboración! Tu experiencia y criterio técnico son fundamentales para elevar el rigor y la calidad científica en nuestra institución. Hemos preparado un espacio cómodo, claro y confidencial para ti.',
    sectionTitle: 'Herramientas para tu evaluación',
    benefits: [
        {
            title: 'Panel de Arbitraje Doble Ciego',
            description: 'Revisa propuestas asignadas con total tranquilidad bajo un entorno blindado que cuida la reserva y objetividad.',
            tag: 'Confidencial',
            path: '/evaluacion-pares'
        },
        {
            title: 'Rúbricas Claras y Cuantitativas',
            description: 'Califica pertinencia, rigor metodológico y presupuesto mediante rúbricas institucionales paso a paso.',
            tag: 'Rúbricas',
            path: '/evaluacion-pares'
        },
        {
            title: 'Emisión Ágil de Dictámenes',
            description: 'Registra tus observaciones constructivas y resoluciones formales con respaldo de firma digital en pocos pasos.',
            tag: 'Dictámenes',
            path: '/evaluacion-pares'
        },
        {
            title: 'Constancias de Arbitraje',
            description: 'Descarga tus certificados de participación avalados con código QR para enriquecer tu trayectoria académica.',
            tag: 'Certificados',
            path: '/verificacion'
        }
    ],
    primaryActionLabel: 'Comenzar',
    primaryActionPath: '/evaluacion-pares'
};

export const DEFAULT_WELCOME: RoleWelcomeConfig = {
    role: 'todos',
    roleLabel: 'Miembro de la Comunidad',
    greeting: 'Bienvenido a DIITRA',
    systemDescription: '¡Te damos la bienvenida a DIITRA! Te invitamos a conocer las investigaciones activas, proyectos de innovación y avances científicos del Tecnológico Traversari.',
    sectionTitle: 'Descubre nuestros espacios',
    benefits: [
        {
            title: 'Investigación e Innovación Abierta',
            description: 'Explora convocatorias vigentes, el banco de proyectos institucionales y las líneas de investigación de cada carrera.',
            tag: 'Ciencia',
            path: '/investigacion'
        },
        {
            title: 'Acreditación y Recursos Oficiales',
            description: 'Accede a normativas, formatos institucionales y herramientas de verificación de documentos académicos.',
            tag: 'Recursos',
            path: '/verificacion'
        }
    ],
    primaryActionLabel: 'Comenzar',
    primaryActionPath: '/investigacion'
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
