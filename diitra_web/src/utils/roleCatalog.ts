/**
 * Catálogo Canónico Centralizado de Roles de Investigación (DIITRA)
 * 
 * Centraliza la definición, normalización y mapeo de roles entre:
 * 1. Proyectos de Investigación (Equipos formales e individuales)
 * 2. Grupos de Investigación Institucionales (Asociativos / Colectivos)
 * 
 * Se alinea estrictamente con la tabla de base de datos `inv_cat_roles` y los estándares CACES.
 */

import api from '../api/axios_config';
import { fetchCatalogCached } from '../api/catalogsCache';

export interface CatRol {
    id_rol?: number;
    uuid?: string;
    codigo?: string;
    nombre: string;
    ambito?: 'PROYECTO' | 'GRUPO' | 'AMBOS';
    tipo_persona?: 'DOCENTE' | 'ESTUDIANTE' | 'ADMINISTRATIVO' | 'EXTERNO' | 'TODOS' | null;
    descripcion?: string | null;
    es_director?: boolean;
    activo?: boolean;
    orden?: number;
    fecha_registro?: string;
}

export const PROJECT_ROLES = {
    DIRECTOR: 'Director de Proyecto',
    CO_INVESTIGADOR: 'Co-Investigador',
    SEMILLERISTA: 'Semillerista',
} as const;

export const GROUP_ROLES = {
    COORDINADOR: 'Coordinador de Grupo',
    MIEMBRO_DOCENTE: 'Miembro Docente',
    SEMILLERISTA: 'Semillerista de Grupo',
    APOYO_TECNICO: 'Personal de Apoyo Técnico',
    INVESTIGADOR_EXTERNO: 'Investigador Externo / Asesor',
} as const;

export type ProjectRole = typeof PROJECT_ROLES[keyof typeof PROJECT_ROLES];
export type GroupRole = typeof GROUP_ROLES[keyof typeof GROUP_ROLES];

/**
 * Normaliza cualquier rol ingresado hacia los 3 roles canónicos de Proyectos.
 */
export function normalizeProjectRole(role?: string | null, tipo?: string | null): ProjectRole {
    if (!role || !role.trim()) {
        const cleanTipo = (tipo || '').toUpperCase();
        return (cleanTipo === 'ESTUDIANTE' || cleanTipo === 'ALUMNO')
            ? PROJECT_ROLES.SEMILLERISTA
            : PROJECT_ROLES.CO_INVESTIGADOR;
    }

    const r = role.trim().toLowerCase();
    if (r.includes('director') || r.includes('coordinador') || r.includes('principal')) {
        return PROJECT_ROLES.DIRECTOR;
    }
    if (r.includes('semillerista') || r.includes('estudiante') || r.includes('alumno')) {
        return PROJECT_ROLES.SEMILLERISTA;
    }

    return PROJECT_ROLES.CO_INVESTIGADOR;
}

/**
 * Normaliza cualquier rol ingresado hacia los 5 roles canónicos de Grupos de Investigación.
 */
export function normalizeGroupRole(role?: string | null, tipo?: string | null): GroupRole {
    if (!role || !role.trim()) {
        const cleanTipo = (tipo || '').toUpperCase();
        if (cleanTipo === 'ESTUDIANTE' || cleanTipo === 'ALUMNO') return GROUP_ROLES.SEMILLERISTA;
        if (cleanTipo === 'ADMINISTRATIVO') return GROUP_ROLES.APOYO_TECNICO;
        if (cleanTipo === 'EXTERNO') return GROUP_ROLES.INVESTIGADOR_EXTERNO;
        return GROUP_ROLES.MIEMBRO_DOCENTE;
    }

    const r = role.trim().toLowerCase();
    if (r.includes('coordinador') || r.includes('director') || r.includes('líder') || r.includes('lider')) {
        return GROUP_ROLES.COORDINADOR;
    }
    if (r.includes('semillerista') || r.includes('estudiante') || r.includes('alumno')) {
        return GROUP_ROLES.SEMILLERISTA;
    }
    if (r.includes('apoyo') || r.includes('técnico') || r.includes('tecnico') || r.includes('administrativo')) {
        return GROUP_ROLES.APOYO_TECNICO;
    }
    if (r.includes('externo') || r.includes('asesor')) {
        return GROUP_ROLES.INVESTIGADOR_EXTERNO;
    }

    return GROUP_ROLES.MIEMBRO_DOCENTE;
}

/**
 * Traduce un rol de Grupo hacia su rol equivalente en un Proyecto Asociativo.
 */
export function mapGroupRoleToProjectRole(
    groupRole?: string | null,
    tipo?: string | null,
    hasActiveDirector: boolean = false
): ProjectRole {
    const normalized = normalizeGroupRole(groupRole, tipo);

    if (normalized === GROUP_ROLES.COORDINADOR) {
        return hasActiveDirector ? PROJECT_ROLES.CO_INVESTIGADOR : PROJECT_ROLES.DIRECTOR;
    }
    if (normalized === GROUP_ROLES.SEMILLERISTA) {
        return PROJECT_ROLES.SEMILLERISTA;
    }

    return PROJECT_ROLES.CO_INVESTIGADOR;
}

/**
 * Determina si un rol corresponde a Director de Proyecto.
 */
export function isProjectDirector(role?: string | null): boolean {
    if (!role) return false;
    return role.trim().toLowerCase().includes('director');
}

/**
 * Carga el catálogo de roles desde el backend con caché transparente.
 */
export async function fetchRolesFromCatalog(ambito?: 'PROYECTO' | 'GRUPO'): Promise<CatRol[]> {
    const query = ambito ? `?ambito=${ambito}` : '';
    const endpoint = `/catalogs/roles${query}`;
    
    try {
        const roles = await fetchCatalogCached(endpoint, () => api.get(endpoint));
        return Array.isArray(roles) ? roles : [];
    } catch (err) {
        console.error(`[roleCatalog] Error al cargar roles para ámbito ${ambito || 'TODOS'}:`, err);
        return [];
    }
}
