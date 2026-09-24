import React from 'react';
import {
    Home,
    FlaskConical,
    Sparkles,
    Megaphone,
    ShieldCheck,
    Gavel,
    Calendar,
    Award,
    Inbox,
    Users,
    GraduationCap,
    Globe,
    MessageSquarePlus,
    TrendingUp,
    BarChart3,
    ShieldAlert,
    FileCode2,
    FileText,
    Mail,
    Bell,
    Activity,
    Settings,
    Trash2,
    Edit3,
    CheckSquare,
    Folder,
    DollarSign
} from 'lucide-react';

export interface ModuleContextInfo {
    modulo: string;
    submodulo?: string;
    /** Etiqueta formateada para chips y badges (ej. "Investigación · Espacio de Trabajo") */
    label: string;
    /** Etiqueta compacta cuando el espacio es reducido */
    shortLabel: string;
    Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    /** Categoría amplia para agrupar filtros */
    categoryKey: 'investigacion' | 'innovacion' | 'convocatorias' | 'evaluacion' | 'calendario' | 'certificados' | 'solicitudes' | 'analiticas' | 'usuarios' | 'admin' | 'general';
}

/**
 * Resuelve el módulo y submódulo exacto de la plataforma DIITRA
 * a partir de la ruta (pathname) y parámetros de búsqueda (search).
 */
export const getModuleContext = (rawPathname: string = '', rawSearch: string = ''): ModuleContextInfo => {
    let pathname = rawPathname;
    let search = rawSearch;

    // Si rawPathname contiene el query string (?...)
    if (rawPathname.includes('?')) {
        const [p, s] = rawPathname.split('?');
        pathname = p;
        if (!search) search = `?${s}`;
    }

    const searchParams = new URLSearchParams(search);

    // ── 1. Espacios de Trabajo / Protocolo (Redacción en curso) ───────────────
    if (pathname.includes('/innovacion/workspace') || pathname.includes('/protocolo-innovacion')) {
        return {
            modulo: 'Innovación',
            submodulo: 'Espacio de Trabajo',
            label: 'Innovación · Espacio de Trabajo',
            shortLabel: 'Workspace Innovación',
            Icon: Sparkles,
            categoryKey: 'innovacion'
        };
    }

    if (pathname.includes('/workspace/')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Espacio de Trabajo',
            label: 'Investigación · Espacio de Trabajo',
            shortLabel: 'Workspace Protocolo',
            Icon: Edit3,
            categoryKey: 'investigacion'
        };
    }

    // ── 2. Investigación: Submódulos Específicos ─────────────────────────────
    if (pathname.includes('/cronograma/')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Cronograma',
            label: 'Investigación · Cronograma',
            shortLabel: 'Cronograma',
            Icon: Calendar,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.includes('/presupuesto/')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Presupuesto',
            label: 'Investigación · Presupuesto',
            shortLabel: 'Presupuesto',
            Icon: DollarSign,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.includes('/equipo/')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Equipo',
            label: 'Investigación · Equipo',
            shortLabel: 'Equipo',
            Icon: Users,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/informes-avance')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Informes de Avance',
            label: 'Investigación · Informes de Avance',
            shortLabel: 'Informes de Avance',
            Icon: FileText,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/revision-tecnica')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Revisión Técnica',
            label: 'Investigación · Revisión Técnica',
            shortLabel: 'Revisión Técnica',
            Icon: CheckSquare,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/revision-informe-final')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Revisión Final',
            label: 'Investigación · Revisión Final',
            shortLabel: 'Revisión Final',
            Icon: CheckSquare,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/mis-proyectos')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Mis Proyectos',
            label: 'Investigación · Mis Proyectos',
            shortLabel: 'Mis Proyectos',
            Icon: Folder,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/adopcion')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Adopción Tecnológica',
            label: 'Investigación · Adopción',
            shortLabel: 'Adopción',
            Icon: Award,
            categoryKey: 'investigacion'
        };
    }

    if (pathname.startsWith('/investigacion/proyectos') || pathname.startsWith('/proyectos')) {
        return {
            modulo: 'Investigación',
            submodulo: 'Proyectos',
            label: 'Investigación · Proyectos',
            shortLabel: 'Proyectos',
            Icon: FlaskConical,
            categoryKey: 'investigacion'
        };
    }

    if (pathname === '/investigacion') {
        return {
            modulo: 'Investigación',
            submodulo: 'Gestión General',
            label: 'Investigación · General',
            shortLabel: 'Investigación',
            Icon: FlaskConical,
            categoryKey: 'investigacion'
        };
    }

    // ── 3. Innovación ────────────────────────────────────────────────────────
    if (pathname.startsWith('/innovacion')) {
        return {
            modulo: 'Innovación',
            submodulo: 'Proyectos de Innovación',
            label: 'Innovación · Proyectos',
            shortLabel: 'Innovación',
            Icon: Sparkles,
            categoryKey: 'innovacion'
        };
    }

    // ── 4. Convocatorias ─────────────────────────────────────────────────────
    if (pathname.startsWith('/convocatorias') || pathname.startsWith('/investigacion/convocatorias')) {
        return {
            modulo: 'Convocatorias',
            submodulo: 'Bases y Postulaciones',
            label: 'Convocatorias · Postulaciones',
            shortLabel: 'Convocatorias',
            Icon: Megaphone,
            categoryKey: 'convocatorias'
        };
    }

    // ── 5. Evaluación de Pares y Arbitraje ───────────────────────────────────
    if (pathname.startsWith('/evaluacion-pares/proyecto') || pathname.startsWith('/arbitraje/proyecto')) {
        return {
            modulo: 'Evaluación de Pares',
            submodulo: 'Arbitraje de Proyecto',
            label: 'Evaluación · Arbitraje',
            shortLabel: 'Arbitraje',
            Icon: Gavel,
            categoryKey: 'evaluacion'
        };
    }

    if (pathname.startsWith('/evaluacion-pares') || pathname.startsWith('/arbitraje')) {
        return {
            modulo: 'Evaluación de Pares',
            submodulo: 'Gestión de Pares',
            label: 'Evaluación · Gestión',
            shortLabel: 'Evaluación Pares',
            Icon: Gavel,
            categoryKey: 'evaluacion'
        };
    }

    if (pathname.startsWith('/revisiones')) {
        return {
            modulo: 'Revisiones',
            submodulo: pathname.includes('/revisiones/') ? 'Revisión en Curso' : 'Mis Revisiones',
            label: pathname.includes('/revisiones/') ? 'Revisiones · En Curso' : 'Revisiones · Mis Revisiones',
            shortLabel: 'Mis Revisiones',
            Icon: ShieldCheck,
            categoryKey: 'evaluacion'
        };
    }

    // ── 6. Calendario y Agenda ───────────────────────────────────────────────
    if (pathname.startsWith('/calendario') || pathname.startsWith('/agenda')) {
        return {
            modulo: 'Calendario',
            submodulo: 'Agenda y Tareas',
            label: 'Calendario · Actividades',
            shortLabel: 'Calendario',
            Icon: Calendar,
            categoryKey: 'calendario'
        };
    }

    // ── 7. Certificados y Verificación Documental ───────────────────────────
    if (pathname.startsWith('/mis-certificados')) {
        return {
            modulo: 'Certificados',
            submodulo: 'Mis Certificados',
            label: 'Certificados · Mis Títulos',
            shortLabel: 'Certificados',
            Icon: Award,
            categoryKey: 'certificados'
        };
    }

    if (pathname.startsWith('/verificacion') || pathname.startsWith('/verificar') || pathname.startsWith('/verify')) {
        return {
            modulo: 'Verificación',
            submodulo: 'Firma Documental',
            label: 'Verificación · Validación',
            shortLabel: 'Verificación',
            Icon: ShieldCheck,
            categoryKey: 'certificados'
        };
    }

    // ── 8. Solicitudes, Grupos e Incidencias ─────────────────────────────────
    if (pathname.startsWith('/grupos') || pathname.startsWith('/admin/groups')) {
        return {
            modulo: 'Grupos',
            submodulo: 'Grupos de Investigación',
            label: 'Grupos · I+D',
            shortLabel: 'Grupos',
            Icon: Users,
            categoryKey: 'solicitudes'
        };
    }

    if (pathname.startsWith('/incidencias') || pathname.startsWith('/admin/incidencias') || pathname.startsWith('/feedback') || pathname.startsWith('/sugerencias')) {
        const isAdminIncidencias = pathname.startsWith('/admin/incidencias');
        return {
            modulo: 'Incidencias',
            submodulo: isAdminIncidencias ? 'Gestión de Incidencias' : 'Buzón de Incidencias',
            label: isAdminIncidencias ? 'Incidencias · Gestión' : 'Incidencias · Buzón',
            shortLabel: 'Incidencias',
            Icon: MessageSquarePlus,
            categoryKey: 'solicitudes'
        };
    }

    if (pathname.startsWith('/solicitudes')) {
        return {
            modulo: 'Solicitudes',
            submodulo: 'Trámites y Solicitudes',
            label: 'Solicitudes · Trámites',
            shortLabel: 'Solicitudes',
            Icon: Inbox,
            categoryKey: 'solicitudes'
        };
    }

    // ── 9. Analíticas y Reportes ─────────────────────────────────────────────
    if (pathname.startsWith('/analiticas')) {
        const tab = searchParams.get('tab') || 'general';
        if (tab === 'caces') {
            return {
                modulo: 'Analíticas',
                submodulo: 'Cumplimiento CACES',
                label: 'Analíticas · CACES',
                shortLabel: 'CACES',
                Icon: ShieldAlert,
                categoryKey: 'analiticas'
            };
        }
        if (tab === 'productos') {
            return {
                modulo: 'Analíticas',
                submodulo: 'Producción Científica',
                label: 'Analíticas · Producción',
                shortLabel: 'Producción I+D',
                Icon: BarChart3,
                categoryKey: 'analiticas'
            };
        }
        return {
            modulo: 'Analíticas',
            submodulo: 'Métricas de I+D',
            label: 'Analíticas · Métricas',
            shortLabel: 'Analíticas',
            Icon: TrendingUp,
            categoryKey: 'analiticas'
        };
    }

    // ── 10. Gestión de Usuarios ──────────────────────────────────────────────
    if (pathname.startsWith('/usuarios') || pathname.startsWith('/admin/usuarios')) {
        const type = searchParams.get('type');
        if (type === 'DOCENTE') {
            return {
                modulo: 'Usuarios',
                submodulo: 'Docentes',
                label: 'Usuarios · Docentes',
                shortLabel: 'Docentes',
                Icon: GraduationCap,
                categoryKey: 'usuarios'
            };
        }
        if (type === 'ESTUDIANTE') {
            return {
                modulo: 'Usuarios',
                submodulo: 'Estudiantes',
                label: 'Usuarios · Estudiantes',
                shortLabel: 'Estudiantes',
                Icon: Users,
                categoryKey: 'usuarios'
            };
        }
        if (type === 'EXTERNO') {
            return {
                modulo: 'Usuarios',
                submodulo: 'Externos',
                label: 'Usuarios · Externos',
                shortLabel: 'Externos',
                Icon: Globe,
                categoryKey: 'usuarios'
            };
        }
        return {
            modulo: 'Usuarios',
            submodulo: 'Directorio',
            label: 'Usuarios · Directorio',
            shortLabel: 'Usuarios',
            Icon: Users,
            categoryKey: 'usuarios'
        };
    }

    // ── 11. Documentos y Plantillas ──────────────────────────────────────────
    if (pathname.startsWith('/plantillas') || pathname.startsWith('/templates') || pathname.startsWith('/admin/plantillas')) {
        return {
            modulo: 'Documentación',
            submodulo: 'Plantillas Oficiales',
            label: 'Plantillas · Modelos',
            shortLabel: 'Plantillas',
            Icon: FileCode2,
            categoryKey: 'admin'
        };
    }

    if (pathname.startsWith('/admin/documentos')) {
        return {
            modulo: 'Documentación',
            submodulo: 'Mantenimiento Documental',
            label: 'Documentos · Mantenimiento',
            shortLabel: 'Documentos',
            Icon: FileText,
            categoryKey: 'admin'
        };
    }

    // ── 12. Comunicaciones y Notificaciones ──────────────────────────────────
    if (pathname.startsWith('/emails') || pathname.startsWith('/admin/emails')) {
        return {
            modulo: 'Comunicaciones',
            submodulo: 'Plantillas de Correo',
            label: 'Comunicaciones · Correos',
            shortLabel: 'Correos',
            Icon: Mail,
            categoryKey: 'admin'
        };
    }

    if (pathname.startsWith('/notificaciones')) {
        return {
            modulo: 'Notificaciones',
            submodulo: 'Centro de Avisos',
            label: 'Notificaciones · Avisos',
            shortLabel: 'Notificaciones',
            Icon: Bell,
            categoryKey: 'general'
        };
    }

    // ── 13. Seguridad y Auditoría ────────────────────────────────────────────
    if (pathname.startsWith('/auditoria') || pathname.startsWith('/admin/audit')) {
        return {
            modulo: 'Auditoría',
            submodulo: 'Trazabilidad y Logs',
            label: 'Auditoría · Logs',
            shortLabel: 'Auditoría',
            Icon: Activity,
            categoryKey: 'admin'
        };
    }

    if (pathname.startsWith('/lopdp') || pathname.startsWith('/admin/lopdp') || pathname.startsWith('/consentimiento-lopdp')) {
        return {
            modulo: 'LOPDP',
            submodulo: 'Protección de Datos',
            label: 'Seguridad · LOPDP',
            shortLabel: 'LOPDP',
            Icon: ShieldCheck,
            categoryKey: 'admin'
        };
    }

    // ── 14. Configuración del Sistema y Papelera ─────────────────────────────
    if (pathname.startsWith('/configuracion') || pathname.startsWith('/settings') || pathname.startsWith('/parametros-normativos')) {
        return {
            modulo: 'Configuración',
            submodulo: 'Parámetros del Sistema',
            label: 'Configuración · Parámetros',
            shortLabel: 'Configuración',
            Icon: Settings,
            categoryKey: 'admin'
        };
    }

    if (pathname.startsWith('/papelera')) {
        return {
            modulo: 'Papelera',
            submodulo: 'Reciclaje',
            label: 'Papelera · Elementos',
            shortLabel: 'Papelera',
            Icon: Trash2,
            categoryKey: 'general'
        };
    }

    // ── 15. Dashboard / Inicio ───────────────────────────────────────────────
    if (pathname === '/dashboard' || pathname === '/') {
        return {
            modulo: 'Tablero',
            submodulo: 'Panel Principal',
            label: 'Tablero · Principal',
            shortLabel: 'Tablero',
            Icon: Home,
            categoryKey: 'general'
        };
    }

    // Fallback genérico limpio
    return {
        modulo: 'General',
        label: 'General',
        shortLabel: 'General',
        Icon: FileText,
        categoryKey: 'general'
    };
};
