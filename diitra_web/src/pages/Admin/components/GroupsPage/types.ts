export interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    carrera?: string;
    telefono_contacto?: string;
}

export interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    carrera_coordinador?: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    categoria_consolidacion?: string;
    activo: boolean;
    estado?: string; // "Pendiente", "Aprobado", "Rechazado", "En Evaluación"
    link_whatsapp?: string;
    telefono_coordinador?: string;
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
    proyectos?: any[];
    Proyectos?: any[];
    teacherMemberCedulas?: string[];
}

export interface ResearchLine {
    id: number;
    nombre: string;
}

export interface Domain {
    id_dominio: number;
    nombre: string;
}

export interface Career {
    id_carrera: number;
    carrera1: string;
}

export interface PendingDraft {
    type: 'new' | 'edit';
    uuid?: string;
    groupName: string;
    timestamp: number;
}

export interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    type: 'danger' | 'warning' | 'info' | 'success';
    isAlert?: boolean;
    confirmText?: string;
}
