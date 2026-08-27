import React from 'react';
import { 
    Users, FileText, CheckCircle2, Award, 
    Sparkles, ShieldCheck, BarChart3, 
    BookOpen, Search, Clock, Cpu
} from 'lucide-react';
import type { RoleWelcomeConfig } from './types';

export const DOCENTE_WELCOME: RoleWelcomeConfig = {
    role: 'docente',
    roleLabel: 'Docente Investigador',
    greeting: '¡Te damos la bienvenida a tu espacio de investigación!',
    subtitle: 'Diseñado para impulsar tus publicaciones, automatizar tu distributivo y facilitar tu producción científica.',
    missionText: 'DIITRA simplifica toda tu gestión académica para que puedas concentrarte en lo que más importa: generar conocimiento e impacto científico.',
    quote: '«La investigación científica no es solo publicar, es transformar realidades a través del conocimiento.»',
    features: [
        {
            icon: <Cpu size={20} className="text-brand" />,
            title: 'Co-Autoría en Vivo (Yjs)',
            description: 'Redacta propuestas y proyectos en tiempo real junto a tu equipo de investigación con sincronización continua.',
            badge: 'Colaborativo'
        },
        {
            icon: <Clock size={20} className="text-emerald-500" />,
            title: 'Control de Carga y Distributivo',
            description: 'Monitorea tus horas semanales asignadas a investigación y sincronízalas directamente con SIGAFI.',
            badge: 'Académico'
        },
        {
            icon: <Users size={20} className="text-amber-500" />,
            title: 'Liderazgo de Grupos y Semilleros',
            description: 'Administra tus líneas de investigación, vincula estudiantes tesistas y reporta la producción bienal del grupo.',
            badge: 'Comunidad'
        },
        {
            icon: <Award size={20} className="text-purple-500" />,
            title: 'Acreditación y Criterios CACES',
            description: 'Formularios y flujos estructurados que garantizan el cumplimiento de los estándares de evaluación institucional.',
            badge: 'Calidad'
        }
    ],
    primaryActionLabel: 'Comenzar a Investigar',
    secondaryActionLabel: 'Explorar Guía Rápida'
};

export const ESTUDIANTE_WELCOME: RoleWelcomeConfig = {
    role: 'estudiante',
    roleLabel: 'Estudiante / Semillero',
    greeting: '¡Bienvenido a tu plataforma de investigación formativa!',
    subtitle: 'El espacio oficial para colaborar en proyectos de grado, unirte a grupos científicos y potenciar tu perfil profesional.',
    missionText: 'Aquí podrás vincularte a semilleros de investigación, certificar tus horas prácticas y trabajar hombro a hombro con tus docentes tutores.',
    quote: '«El futuro de la innovación comienza con tu curiosidad y rigor académico.»',
    features: [
        {
            icon: <Search size={20} className="text-brand" />,
            title: 'Directorio de Grupos Científicos',
            description: 'Explora las líneas de investigación activas de tu carrera y postula para colaborar en semilleros de innovación.',
            badge: 'Oportunidades'
        },
        {
            icon: <BookOpen size={20} className="text-emerald-500" />,
            title: 'Acreditación de Horas Formativas',
            description: 'Tus horas y aportes en proyectos de investigación quedan respaldados digitalmente para tu proceso de titulación.',
            badge: 'Titulación'
        },
        {
            icon: <FileText size={20} className="text-amber-500" />,
            title: 'Espacio de Trabajo Asistido',
            description: 'Accede a las plantillas normativas institucionales y entrega tus avances en formato oficial sin complicaciones.',
            badge: 'Plantillas'
        },
        {
            icon: <Sparkles size={20} className="text-purple-500" />,
            title: 'Tutoría Directa con Docentes',
            description: 'Recibe retroalimentación en línea de tus directores de proyecto y mantén un historial claro de tus revisiones.',
            badge: 'Seguimiento'
        }
    ],
    primaryActionLabel: 'Explorar Oportunidades',
    secondaryActionLabel: 'Ver Guía del Estudiante'
};

export const ADMIN_WELCOME: RoleWelcomeConfig = {
    role: 'admin',
    roleLabel: 'Administrador del Ecosistema',
    greeting: '¡Bienvenido al Centro de Mando Institucional!',
    subtitle: 'Control unificado del ciclo de vida documental, analíticas científicas y gobernanza de datos de DIITRA.',
    missionText: 'Dispones de visibilidad total sobre la producción académica, convocatorias, auditoría forense y cumplimiento de normativas de acreditación.',
    quote: '«La gobernanza eficiente y la transparencia son el cimiento de la excelencia institucional.»',
    features: [
        {
            icon: <BarChart3 size={20} className="text-brand" />,
            title: 'Analíticas y KPIs en Tiempo Real',
            description: 'Métricas integrales de proyectos aprobados, presupuesto ejecutado, publicaciones y carga horaria docente.',
            badge: 'Mando'
        },
        {
            icon: <FileText size={20} className="text-emerald-500" />,
            title: 'Ciclo de Vida Documental',
            description: 'Gestión de plantillas universales, aprobaciones, firmas digitales y control de versiones institucionales.',
            badge: 'Documentos'
        },
        {
            icon: <ShieldCheck size={20} className="text-purple-500" />,
            title: 'Auditoría y Privacidad LOPDP',
            description: 'Trazabilidad criptográfica de eventos, solicitudes de derechos ARCO y resguardo de datos sensibles.',
            badge: 'Seguridad'
        },
        {
            icon: <Award size={20} className="text-amber-500" />,
            title: 'Alineación CACES & Parámetros',
            description: 'Configuración de convocatorias, baremos de evaluación y parámetros normativos para el instituto.',
            badge: 'Acreditación'
        }
    ],
    primaryActionLabel: 'Ingresar a la Consola',
    secondaryActionLabel: 'Revisar Auditoría'
};

export const REVISOR_WELCOME: RoleWelcomeConfig = {
    role: 'revisor',
    roleLabel: 'Revisor Par Evaluador',
    greeting: '¡Bienvenido al Panel de Arbitraje Científico!',
    subtitle: 'Plataforma confidencial y rigurosa para la evaluación técnica y metodológica de proyectos de investigación.',
    missionText: 'DIITRA garantiza un entorno de revisión ciego, ágil y trazable con rúbricas cuantitativas alineadas a estándares internacionales.',
    quote: '«El arbitraje riguroso y objetivo garantiza la calidad y relevancia del conocimiento científico.»',
    features: [
        {
            icon: <CheckCircle2 size={20} className="text-brand" />,
            title: 'Evaluación por Rúbricas CACES',
            description: 'Califica cada criterio metodológico con criterios ponderados y justificaciones estructuradas.',
            badge: 'Rúbricas'
        },
        {
            icon: <ShieldCheck size={20} className="text-emerald-500" />,
            title: 'Arbitraje Ciego y Confidencial',
            description: 'Revisa manuscritos y propuestas con total imparcialidad y protección de la identidad de los autores.',
            badge: 'Ética'
        },
        {
            icon: <FileText size={20} className="text-purple-500" />,
            title: 'Dictámenes y Firma Digital',
            description: 'Emite resoluciones formales con validez institucional mediante firma electrónica segura.',
            badge: 'Dictamen'
        },
        {
            icon: <Clock size={20} className="text-amber-500" />,
            title: 'Gestión de Plazos de Convocatoria',
            description: 'Monitorea las fechas límite asignadas para cada dictamen y gestiona tus revisiones a tu propio ritmo.',
            badge: 'Tiempos'
        }
    ],
    primaryActionLabel: 'Ver Proyectos por Evaluar',
    secondaryActionLabel: 'Consultar Criterios'
};

export const DEFAULT_WELCOME: RoleWelcomeConfig = {
    role: 'todos',
    roleLabel: 'Miembro de la Comunidad',
    greeting: '¡Te damos la bienvenida al Ecosistema DIITRA!',
    subtitle: 'La plataforma integral de investigación, desarrollo tecnológico y producción académica del Tecnológico Traversari.',
    missionText: 'Explora proyectos, consulta publicaciones científicas y participa en el crecimiento del conocimiento institucional.',
    quote: '«Investigar es ver lo que todo el mundo ha visto, y pensar lo que nadie más ha pensado.»',
    features: [
        {
            icon: <Cpu size={20} className="text-brand" />,
            title: 'Plataforma Inteligente',
            description: 'Herramientas modernas para la formulación, seguimiento y acreditación de proyectos científicos.',
            badge: 'Tecnología'
        },
        {
            icon: <Award size={20} className="text-emerald-500" />,
            title: 'Calidad Institucional',
            description: 'Alineado integralmente a los criterios de investigación y vinculación del CACES.',
            badge: 'Excelencia'
        },
        {
            icon: <Users size={20} className="text-purple-500" />,
            title: 'Trabajo Colaborativo',
            description: 'Conecta con docentes, tesistas y evaluadores en un solo entorno de trabajo unificado.',
            badge: 'Comunidad'
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
