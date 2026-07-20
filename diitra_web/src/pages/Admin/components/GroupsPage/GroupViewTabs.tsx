import React from 'react';

interface GroupViewTabsProps {
    viewMode: 'all' | 'my';
    setViewMode: (mode: 'all' | 'my') => void;
    myGroupsCount: number;
    allGroupsCount: number;
}

export const GroupViewTabs: React.FC<GroupViewTabsProps> = ({
    viewMode,
    setViewMode,
    myGroupsCount,
    allGroupsCount,
}) => {
    return (
        <div className="flex border-b border-border-thin mb-5 gap-6 animate-fade-up">
            <button
                onClick={() => setViewMode('my')}
                className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    viewMode === 'my'
                        ? 'border-text-main text-text-main font-bold'
                        : 'border-transparent text-text-dim hover:text-text-main'
                }`}
            >
                Mis Grupos ({myGroupsCount})
            </button>
            <button
                onClick={() => setViewMode('all')}
                className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    viewMode === 'all'
                        ? 'border-text-main text-text-main font-bold'
                        : 'border-transparent text-text-dim hover:text-text-main'
                }`}
            >
                Todos los Grupos ({allGroupsCount})
            </button>
        </div>
    );
};
