import type { HelpConfig } from '../types';
import { 
    DEFAULT_CONFIG, DASHBOARD_CONFIG, SETTINGS_CONFIG, ANALYTICS_CONFIG, NOTIFICATIONS_CONFIG, VERIFY_CONFIG, CONVOCATORIAS_CONFIG 
} from './general';
import { 
    INVESTIGACION_CONFIG, MIS_PROYECTOS_CONFIG, ADOPCION_CONFIG, MONITOREO_CONFIG, INFORMES_AVANCE_CONFIG 
} from './investigacion';
import { 
    REVISIONES_CONFIG, EVALUACION_CONFIG, ARBITRAJE_CONFIG, ARBITRAJE_PROYECTO_CONFIG 
} from './revisiones';
import { 
    USUARIOS_CONFIG, AUDITORIA_CONFIG, CONFIGURACION_CONFIG, GRUPOS_CONFIG, EMAILS_CONFIG 
} from './admin';

export const HELP_MAP: Record<string, HelpConfig> = {
    '/dashboard': DASHBOARD_CONFIG,
    '/settings': SETTINGS_CONFIG,
    '/analiticas': ANALYTICS_CONFIG,
    '/notificaciones': NOTIFICATIONS_CONFIG,
    '/verify': VERIFY_CONFIG,
    '/convocatorias': CONVOCATORIAS_CONFIG,
    
    '/investigacion': INVESTIGACION_CONFIG,
    '/investigacion/mis-proyectos': MIS_PROYECTOS_CONFIG,
    '/investigacion/adopcion': ADOPCION_CONFIG,
    '/investigacion/monitoreo': MONITOREO_CONFIG,
    '/investigacion/informes-avance': INFORMES_AVANCE_CONFIG,
    
    '/revisiones': REVISIONES_CONFIG,
    '/revisiones/evaluacion': EVALUACION_CONFIG,
    '/arbitraje': ARBITRAJE_CONFIG,
    '/arbitraje/proyecto': ARBITRAJE_PROYECTO_CONFIG,
    
    '/usuarios': USUARIOS_CONFIG,
    '/auditoria': AUDITORIA_CONFIG,
    '/configuracion': CONFIGURACION_CONFIG,
    '/grupos': GRUPOS_CONFIG,
    '/admin/emails': EMAILS_CONFIG
};

export { DEFAULT_CONFIG };

export const normalizePathname = (path: string): string => {
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'investigacion' && segments[1] === 'monitoreo' && segments.length > 2) {
        return '/investigacion/monitoreo';
    }
    if (segments[0] === 'investigacion' && segments[1] === 'informes-avance' && segments.length > 2) {
        return '/investigacion/informes-avance';
    }
    if (segments[0] === 'revisiones' && segments.length > 1) {
        return '/revisiones/evaluacion';
    }
    if (segments[0] === 'arbitraje' && segments[1] === 'proyecto' && segments.length > 2) {
        return '/arbitraje/proyecto';
    }
    return path;
};
