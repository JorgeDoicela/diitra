import { Users, LayoutDashboard, Scale, ShieldCheck, LucideIcon } from 'lucide-react';

export interface RoleInfo {
    role: string;
    desc: string;
    icon: LucideIcon;
    permissions: string[];
}

export const ROLES_DATA: RoleInfo[] = [
    { 
        role: 'Investigador', 
        desc: 'Docentes y estudiantes que postulan proyectos, coordinan avances y cargan entregables.', 
        icon: Users,
        permissions: ['Crear propuestas de proyecto', 'Planificar presupuestos e hitos', 'Cargar evidencias de avance']
    },
    { 
        role: 'Director de Investigación', 
        desc: 'Gestiona convocatorias, asigna pares evaluadores y supervisa presupuestos globales.', 
        icon: LayoutDashboard,
        permissions: ['Apertura de convocatorias', 'Asignación de pares doble ciego', 'Supervisión presupuestaria']
    },
    { 
        role: 'Comité de Ética / Revisores', 
        desc: 'Evalúan de forma ciega y anónima la calidad metodológica y ética de las propuestas.', 
        icon: Scale,
        permissions: ['Evaluación anónima doble ciego', 'Emisión de actas de dictamen', 'Firma electrónica de resoluciones']
    },
    { 
        role: 'Administrador', 
        desc: 'Configuración de períodos académicos, líneas de investigación e integraciones de API externas.', 
        icon: ShieldCheck,
        permissions: ['Configuración del sistema', 'Gestión de distributivos docentes', 'Integración y API (SIIES / DSpace)']
    },
];
