import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AuditLog {
    id_audit: number;
    admin_name: string;
    target_name: string;
    action: string;
    modulo: string;
    details: string;
    ip_address: string;
    user_agent: string;
    values_before: string;
    values_after: string;
    date: string;
}

export interface PagedResult {
    items: AuditLog[];
    total_count: number;
    page_number: number;
    page_size: number;
    total_pages: number;
}

export const ACTION_LABELS: Record<string, string> = {
    ACTUALIZAR_METADATA: 'Actualizar datos del documento',
    ACTUALIZAR_PROYECTO: 'Actualizar proyecto',
    ACTUALIZAR_EQUIPO_PROYECTO: 'Actualizar equipo del proyecto',
    REGISTRO_EXTERNO: 'Registro externo',
    ASIGNAR_ROL: 'Asignar rol',
    REVOCAR_ROL: 'Revocar rol',
    CREAR_GRUPO: 'Crear grupo',
    EDITAR_GRUPO: 'Editar grupo',
    APROBAR_GRUPO: 'Aprobar grupo',
    RECHAZAR_GRUPO: 'Rechazar grupo',
    DESACTIVAR_GRUPO: 'Desactivar grupo',
    AGREGAR_MIEMBRO_GRUPO: 'Agregar miembro al grupo',
    LOGIN: 'Inicio de sesión',
};

export const formatActionLabel = (action: string | null | undefined): string => {
    if (!action) return 'S/A';
    if (ACTION_LABELS[action]) return ACTION_LABELS[action];
    return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
};

export const formatDateSafe = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '—';
        return format(d, formatStr, { locale: es });
    } catch {
        return '—';
    }
};

export const formatKeyName = (key: string): string => {
    const dictionary: Record<string, string> = {
        TieneGrupoInvestigacion: '¿Tiene Grupo?',
        CodigoInstitucional: 'Código Institucional',
        DescripcionProyecto: 'Descripción',
        Antecedentes: 'Antecedentes',
        Justificacion: 'Justificación',
        MarcoTeorico: 'Marco Teórico',
        Metodologia: 'Metodología',
        Evaluacion: 'Método de Evaluación',
        TiempoEjecucion: 'Tiempo Ejecución (meses)',
        TrlInicial: 'TRL Inicial',
        TrlActual: 'TRL Actual',
        TrlMeta: 'TRL Meta',
        Estado: 'Estado del Proyecto',
        IdGrupo: 'ID Grupo',
        IdConvocatoria: 'ID Convocatoria',
        IdObjetivoPnd: 'ID Objetivo PND',
        IdEntidadAliada: 'ID Entidad Aliada',
        OrcidId: 'ID ORCID',
        ScopusId: 'ID Scopus',
        GoogleScholarUrl: 'Google Scholar URL',
        ResearchGateUrl: 'ResearchGate URL',
        Especialidad: 'Especialidad',
        GradoAcademicoMaximo: 'Grado Máximo',
        RolesActivos: 'Roles Activos',
        RolAsignado: 'Rol Asignado',
        RolRevocado: 'Rol Revocado',
        Cedula: 'Cédula / Pasaporte',
        Nombre: 'Nombre Completo',
        Institucion: 'Institución',
        GradoAcademico: 'Grado Académico',
        Titulo: 'Título del Proyecto',
        FirmaHabilitada: '¿Firma Habilitada?',
        Version: 'Versión del Registro'
    };
    return dictionary[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

export const getActionBadge = (action: string): string => {
    const a = action.toUpperCase();
    if (a.includes('REVOKE') || a.includes('REVOCAR') || a.includes('DELETE') || a.includes('REMOVE') || a.includes('ELIMINAR') || a.includes('DESACTIVAR')) return 'badge-vercel-error';
    if (a.includes('ASIGN') || a.includes('REGISTER') || a.includes('CREATE') || a.includes('ADD') || a.includes('CREAR') || a.includes('AGREGAR') || a.includes('APROBAR')) return 'badge-vercel-success';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY') || a.includes('ACTUALIZAR') || a.includes('CAMBIAR') || a.includes('TRANSICIONAR') || a.includes('EVALUAR') || a.includes('RECHAZAR') || a.includes('TRANSFERIR')) return 'badge-vercel-warning';
    return 'badge-vercel-info';
};
