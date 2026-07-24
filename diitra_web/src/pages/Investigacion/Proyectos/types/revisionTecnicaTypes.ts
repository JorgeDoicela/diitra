import { FileText, Users, Activity, DollarSign, Target, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ProjectDetail {
    uuid: string;
    title: string;
    status: string;
    presupuesto: number;
    convocatoriaMontoMaximo: number | null;
    convocatoria: string;
    linea: string;
    carrera: string;
    dominio: string;
    descripcion: string;
    directorProyecto: string;
}

export interface SectionComment {
    id: number;
    status: 'Pendiente' | 'Aprobado' | 'Corregir';
    text: string;
    creadoEn?: string;
    nombreUsuario?: string;
}

export interface SectionItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

export const FIELD_LABELS: Record<string, string> = {
    titulo: 'Tema / Nombre del Proyecto',
    programa: 'Programa del Proyecto',
    grupo: 'Grupo de Investigación',
    dominio_linea: 'Dominio y Líneas de Investigación',
    carrera: 'Carrera y Convocatoria',
    campos: 'Campos Detallados (CACES)',
    equipo: 'Equipo Humano de Investigación',
    antecedentes: 'Antecedentes de la Propuesta',
    justificacion: 'Justificación del Proyecto',
    objetivos: 'Objetivo General y Específicos',
    metodologia: 'Metodología y Diseño Técnico',
    presupuesto: 'Recursos y Presupuesto',
    impacto: 'Impacto y Productos Esperados',
    cronograma: 'Cronograma (Diagrama de Gantt)',
    bibliografia: 'Bibliografía y Firmas de Responsabilidad'
};

export const SECTIONS: SectionItem[] = [
    { id: 'identificacion', label: 'Identificación', icon: FileText },
    { id: 'equipo', label: 'Equipo Humano', icon: Users },
    { id: 'plan_tecnico', label: 'Plan Técnico', icon: Activity },
    { id: 'recursos', label: 'Recursos & Financiamiento', icon: DollarSign },
    { id: 'impacto', label: 'Impacto & Productos', icon: Target },
    { id: 'cronograma', label: 'Cronograma (Gantt)', icon: Activity },
    { id: 'bibliografia', label: 'Bibliografía & Firmas', icon: BookOpen }
];
