import React from 'react';
import { Users, Search, Plus } from 'lucide-react';
import { PageHeader } from '../../../../components/Common/PageHeader';

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
        <PageHeader
            kicker="Investigación y Desarrollo"
            icon={Users}
            title="Grupos de Investigación"
            description="Administración centralizada de grupos institucionales, semilleros y líneas de vinculación tecnológica."
        >
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
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
        </PageHeader>
    );
};
