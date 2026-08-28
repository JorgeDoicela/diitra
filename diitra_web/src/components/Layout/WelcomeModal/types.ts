import { DiitraRole } from '../Help/types';

export interface RoleBenefit {
    title: string;
    description: string;
    tag: string;
}

export interface RoleWelcomeConfig {
    role: DiitraRole;
    roleLabel: string;
    greeting: string;
    systemDescription: string;
    sectionTitle: string;
    benefits: RoleBenefit[];
    primaryActionLabel: string;
}
