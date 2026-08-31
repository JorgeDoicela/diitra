export interface Convocatoria {
    id_convocatoria?: number;
    uuid: string;
    codigo_convocatoria: string;
    titulo: string;
    id_periodo: string;
    periodo_nombre?: string;
    anio: string;
    id_tipo_convocatoria?: number;
    fecha_apertura: string;
    fecha_cierre: string;
    estado: 'Borrador' | 'Abierta' | 'Cerrada' | 'Anulada';
    proyectos?: { uuid: string; titulo: string; codigo_institucional?: string; estado: string }[];
}

export interface Periodo {
    id_periodo: string;
    detalle: string;
}

export interface Catalogo {
    id: number;
    nombre: string;
}
