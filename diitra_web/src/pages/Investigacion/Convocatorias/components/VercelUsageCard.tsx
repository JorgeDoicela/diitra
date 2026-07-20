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
                                    {item.hint && (
                                        <span className="relative inline-flex shrink-0 group/hint">
                                            <button
                                                type="button"
                                                aria-label={item.hint}
                                                aria-expanded={isHintOpen}
                                                onClick={() => setActiveHint(isHintOpen ? null : idx)}
                                                className="text-text-dim/40 hover:text-text-main transition-colors cursor-help focus:outline-none focus:text-text-main"
                                            >
                                                <svg
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    aria-hidden="true"
                                                >
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                            </button>
                                            <span
                                                role="tooltip"
                                                className={`absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] z-50 w-52 max-w-[min(13rem,calc(100vw-3rem))] px-3 py-2 rounded-lg text-[10px] font-normal normal-case leading-relaxed tracking-normal text-text-main bg-surface border border-border-thin shadow-lg pointer-events-none transition-opacity duration-150 ${isHintOpen
                                                        ? 'opacity-100 visible'
                                                        : 'opacity-0 invisible group-hover/hint:opacity-100 group-hover/hint:visible'
                                                    }`}
                                            >
                                                {item.hint}
                                                <span
                                                    className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 rotate-45 bg-surface border-r border-b border-border-thin"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </span>
                                    )}
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
