import React from 'react';

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
    estado?: string;
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
    proyectos?: any[];
    Proyectos?: any[];
    link_whatsapp?: string;
    telefono_coordinador?: string;
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

export interface GroupFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    editingGroup: Group | null;
    isReadOnly: boolean;
    isAdmin: boolean;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    fetchData: () => void;
    setConfirmDialog: React.Dispatch<React.SetStateAction<any>>;
    formatUserDetails: (u: any) => string;
    formatCareerName: (name: string) => string;
    onDraftCleared?: () => void;
}

export interface GroupFormData {
    nombre: string;
    siglas: string;
    tipo_grupo: string;
    id_dominio: string;
    id_profesor_coordinador: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    categoria_consolidacion: string;
    lineas_ids: number[];
    carreras_ids: number[];
    link_whatsapp: string;
    telefono_coordinador: string;
}
