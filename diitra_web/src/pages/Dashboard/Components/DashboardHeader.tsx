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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 px-2 animate-fade-up gap-6 md:gap-0">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                    <Activity size={10} strokeWidth={2} className="text-text-main" />
                    <span>{roleName} - ISTPET</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter">{title}</h2>
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
