import React from 'react';

export interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    badgeText?: string;
    subText?: string;
    accentColor?: string;
    footerItems?: { label: string; value: string | number; valueColorClass?: string }[];
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon,
    badgeText,
    subText,
    accentColor = 'brand',
    footerItems
}) => {
    const textAccentClass = {
        brand: 'text-brand',
        success: 'text-success',
        warning: 'text-warning',
        violet: 'text-purple-400'
    }[accentColor] || 'text-text-dim';

    return (
        <div className="bento-card static p-5 space-y-4 relative overflow-hidden group select-none hover:-translate-y-1 hover:shadow-md hover:shadow-brand/5 hover:border-brand/35 transition-all duration-300">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-text-dim font-mono">{title}</span>
                <span className={`transition-all duration-300 group-hover:scale-105 ${textAccentClass}`}>
                    {icon}
                </span>
            </div>
            
            <div className="space-y-1">
                <h3 className="text-3xl font-semibold tracking-tight text-text-main font-sans">{value}</h3>
                {subText && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-text-dim uppercase">
                        {badgeText && (
                            <span className={`font-mono font-semibold ${textAccentClass}`}>
                                {badgeText}
                            </span>
                        )}
                        <span>{subText}</span>
                    </div>
                )}
            </div>

            {footerItems && footerItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 border-t border-border-thin/60 pt-3.5 mt-2 text-[10px] font-bold">
                    {footerItems.map((item, idx) => (
                        <div key={idx}>
                            <span className="text-text-dim block text-[8px] uppercase tracking-wider font-mono">{item.label}</span>
                            <span className={`font-mono ${item.valueColorClass || 'text-text-main'}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
