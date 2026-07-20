import React from 'react';
import type { AnalyticsTab } from '../hooks/useAnalyticsState';

export interface AnalyticsTabsProps {
    activeTab: AnalyticsTab;
    setActiveTab: (tab: AnalyticsTab) => void;
}

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({
    activeTab,
    setActiveTab
}) => {
    return (
        <div className="tabs-vercel">
            <button
                onClick={() => setActiveTab('general')}
                className={`tab-vercel-item ${activeTab === 'general' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                id="tab-general"
            >
                Métricas de I+D
            </button>
            <button
                onClick={() => setActiveTab('caces')}
                className={`tab-vercel-item ${activeTab === 'caces' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                id="tab-caces"
            >
                Cumplimiento CACES
            </button>
            <button
                onClick={() => setActiveTab('productos')}
                className={`tab-vercel-item ${activeTab === 'productos' ? 'active' : ''} text-[10px] font-black uppercase tracking-widest`}
                id="tab-productos"
            >
                Proyectos y Producción
            </button>
        </div>
    );
};
