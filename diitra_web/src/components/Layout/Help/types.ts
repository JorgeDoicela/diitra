import React from 'react';

export interface HelpStep {
    title: string;
    description: string;
    highlight: 'sidebar' | 'topbar' | 'content-top' | 'content-bottom' | 'all' | 'none';
}

export interface MockupProps {
    highlightTopClass: string;
    highlightBottomClass: string;
}

export interface HelpConfig {
    icon: React.ReactNode;
    title: string;
    summary: string;
    description: string;
    steps: HelpStep[];
    compliance: string;
    tips: string[];
    Mockup?: React.ComponentType<MockupProps>;
}
