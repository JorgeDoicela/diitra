import React from 'react';
import { Users, Search, Plus } from 'lucide-react';

interface GroupsHeaderProps {
    search: string;
    setSearch: (value: string) => void;
    onOpenCreate: () => void;
    isAdmin: boolean;
}

export const GroupsHeader: React.FC<GroupsHeaderProps> = ({
    search,
    setSearch,
    onOpenCreate,
    isAdmin,
}) => {
    return (
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-12 animate-fade-up gap-8 lg:gap-0">
            <div className="space-y-2">
                <div className="section-label text-text-main">
                    <Users size={10} strokeWidth={2} />
                    <span>Investigación y Desarrollo</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">
                    Grupos de Investigación
                </h2>
                <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                    Administración centralizada de grupos institucionales, semilleros y líneas de vinculación tecnológica.
                </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar grupos por nombre, siglas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-vercel !pl-10 !py-2.5 !text-xs uppercase tracking-wider font-mono placeholder:!lowercase"
                    />
                </div>
                <button
                    onClick={onOpenCreate}
                    className="btn-brand flex items-center justify-center gap-2 text-xs font-bold"
                >
                    <Plus size={14} strokeWidth={3} />
                    {isAdmin ? 'Crear Grupo' : 'Proponer Grupo'}
                </button>
            </div>
        </header>
    );
};
