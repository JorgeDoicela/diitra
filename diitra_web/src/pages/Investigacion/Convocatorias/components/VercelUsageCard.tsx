import { useState } from 'react';

interface MetricItem {
    label: string;
    value: number;
    displayValue?: string;
    max?: number;
    color?: string;
    hint?: string;
}

interface VercelUsageCardProps {
    title: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    items: MetricItem[];
}

export const VercelUsageCard = ({ title, buttonLabel, onButtonClick, items }: VercelUsageCardProps) => {
    const [activeHint, setActiveHint] = useState<number | null>(null);

    return (
        <div className="bento-card static p-5 flex flex-col relative overflow-visible bg-surface border border-border-thin shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-5">
                <span className="text-[14px] font-semibold text-text-main tracking-tight">{title}</span>
                {buttonLabel && (
                    <button
                        onClick={onButtonClick}
                        className="px-3 py-1 bg-black text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-black dark:hover:bg-[#eaeaea] rounded-md text-[11px] font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                        {buttonLabel}
                    </button>
                )}
            </div>
            <div className="space-y-1">
                {items.map((item, idx) => {
                    const percentage = item.max ? Math.min(100, Math.round((item.value / item.max) * 100)) : 0;
                    const radius = 6.5;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                    const isHintOpen = activeHint === idx;

                    return (
                        <div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 rounded-md transition-all"
                            style={{ backgroundColor: idx % 2 === 0 ? 'var(--accents-1)' : 'transparent' }}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-[18px] h-[18px] flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 18 18">
                                        <circle
                                            cx="9"
                                            cy="9"
                                            r={radius}
                                            className="fill-none"
                                            strokeWidth="1.8"
                                            style={{ stroke: 'var(--accents-2)' }}
                                        />
                                        <circle
                                            cx="9"
                                            cy="9"
                                            r={radius}
                                            className="fill-none transition-all duration-500"
                                            stroke={item.color || 'var(--brand)'}
                                            strokeWidth="1.8"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={item.max ? strokeDashoffset : 0}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[13px] font-medium text-text-main truncate">
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[13px] font-mono font-medium text-text-main shrink-0 ml-2">
                                {item.displayValue || item.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
