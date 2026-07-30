import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    kicker: string;
    icon?: LucideIcon;
    title: string;
    description?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    kicker,
    icon: Icon,
    title,
    description,
    children,
    className = '',
}) => {
    return (
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 pb-2 mb-6 ${className}`}>
            <div className="space-y-1.5">
                <div className="section-label text-text-dim">
                    {Icon && <Icon />}
                    <span>{kicker}</span>
                </div>
                <h1 className="page-header-title">
                    {title}
                </h1>
                {description && (
                    <div className="text-xs text-text-dim font-medium leading-relaxed">
                        {description}
                    </div>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 mt-3 md:mt-0 shrink-0 md:self-end md:mb-1">
                    {children}
                </div>
            )}
        </header>
    );
};
