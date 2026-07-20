import type { LucideIcon } from 'lucide-react';

export interface SidebarProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed: boolean;
    onCollapse: () => void;
    onExpand: () => void;
}

export interface MenuItem {
    name: string;
    icon: LucideIcon;
    path: string;
    roles?: string[];
    permission?: string;
    group: number;
    hasChevron?: boolean;
    indent?: boolean;
}

export interface SidebarProject {
    uuid: string;
    titulo?: string;
    fecha_modificacion?: string;
    fecha_registro?: string;
}

export interface NotificationItem {
    uuid: string;
    titulo: string;
    mensaje: string;
    categoria: string;
    leido: boolean;
    url_accion?: string;
    fecha_envio: string;
}
