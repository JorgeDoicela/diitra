import React from 'react';
import { Search } from 'lucide-react';

interface SidebarSearchProps {
    triggerCommandPalette: () => void;
    searchShortcut: string;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({ triggerCommandPalette, searchShortcut }) => {
    return (
        <div className="px-3 mb-2">
            <div
                onClick={triggerCommandPalette}
                className="flex h-8.5 items-center gap-2 px-2.5 bg-surface border border-border-thin rounded-md group hover:border-text-dim/50 hover:bg-surface-hover/30 transition-all cursor-pointer"
            >
                <Search size={13} className="text-text-dim group-hover:text-text-main transition-colors" />
                <span className="text-[14px] text-text-dim flex-1 font-medium group-hover:text-text-main transition-colors">Buscar</span>
                <kbd className="text-[10px] font-sans font-semibold bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin text-text-dim shadow-sm">{searchShortcut}</kbd>
            </div>
        </div>
    );
};
