export interface Member {
    idGrupoMiembro: number;
    idUsuario: number;
    nombreCompleto: string;
    rol: string;
    activo: boolean;
    carrera?: string;
    orcidId?: string;
    scopusId?: string;
    googleScholarUrl?: string;
    researchGateUrl?: string;
    especialidad?: string;
    gradoAcademicoMaximo?: string;
}

export interface Project {
    uuid: string;
    titulo: string;
    estado: string;
    codigoInstitucional?: string;
    directorNombre?: string;
}

export interface Group {
    idGrupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    tipoGrupo: string;
    nombreCoordinador?: string;
    carreraCoordinador?: string;
    objetivoGeneral?: string;
    mision?: string;
    vision?: string;
    resolucionAprobacion?: string;
    fechaCreacion?: string;
    categoriaConsolidacion?: string;
    lineasNombres?: string[];
    carrerasNombres?: string[];
    miembros?: Member[];
    proyectos?: Project[];
    fotoUrl?: string;
    idCoordinador?: number;
    idProfesorCoordinador?: string;
    idDominio?: number;
    linkWhatsapp?: string;
    telefonoCoordinador?: string;
    lineasIds?: number[];
    carrerasIds?: number[];
}

export interface PublicGroupsPageProps {
    currentTheme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

export const formatNombre = (nombre?: string) => {
    if (!nombre) return 'No asignado';
    return nombre.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
};

export const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'N/A';
    try {
        const cleanFecha = fechaStr.split('T')[0];
        const [year, month, day] = cleanFecha.split('-');
        return `${day}/${month}/${year}`;
    } catch { return fechaStr; }
};

export const estadoColor = (estado: string) => {
    const l = estado.toLowerCase();
    if (l === 'aprobado' || l === 'completado') return 'text-success';
    if (l === 'en ejecución' || l === 'en progreso') return 'text-warning';
    return 'text-text-dim';
};
