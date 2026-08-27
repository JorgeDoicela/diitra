import React from 'react';
import { DiitraRole } from '../Help/types';

export interface WelcomeFeature {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
}

export interface RoleWelcomeConfig {
    role: DiitraRole;
    roleLabel: string;
    greeting: string;
    subtitle: string;
    missionText: string;
    features: WelcomeFeature[];
    quote: string;
    primaryActionLabel: string;
    secondaryActionLabel?: string;
}
