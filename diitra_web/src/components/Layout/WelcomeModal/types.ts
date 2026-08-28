import { DiitraRole } from '../Help/types';

export interface SummaryMetricRow {
    label: string;
    value: string;
    statusColor?: 'emerald' | 'blue' | 'amber' | 'neutral';
}

export interface ModuleActionPoint {
    title: string;
    description: string;
    tag?: string;
}

export interface WelcomeModule {
    id: string;
    title: string;
    summary: string;
    badge: string;
    details: {
        headline: string;
        summaryTitle: string;
        summaryRows: SummaryMetricRow[];
        actionPoints: ModuleActionPoint[];
        footerNote?: string;
    };
}

export interface RoleWelcomeConfig {
    role: DiitraRole;
    roleLabel: string;
    greeting: string;
    subtitle: string;
    modules: WelcomeModule[];
    primaryActionLabel: string;
    secondaryActionLabel?: string;
}
