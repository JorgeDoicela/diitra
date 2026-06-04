import React from 'react';
import { Activity } from 'lucide-react';

interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    roleName: string;
    actions?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, roleName, actions }) => {
    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 animate-fade-up gap-6 md:gap-0">
            <div className="space-y-2">
                <div className="section-label text-text-main">
                    <Activity size={10} strokeWidth={2} />
                    <span>{roleName} - ISTPET</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">{title}</h2>
                <p className="text-sm text-text-dim max-w-lg font-medium">{subtitle}</p>
            </div>
            
            {actions && (
                <div className="flex w-full md:w-auto gap-3 md:gap-4">
                    {actions}
                </div>
            )}
        </header>
    );
};
