import React from 'react';
import { Shield, UserPlus, Globe, Search, X } from 'lucide-react';
import { PageHeader } from '../../../../components/Common/PageHeader';

interface UsersHeaderProps {
    userType: 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO';
    setUserType: (type: 'DOCENTE' | 'ESTUDIANTE' | 'EXTERNO') => void;
    search: string;
    setSearch: (search: string) => void;
    loading: boolean;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    setError: (error: string) => void;
    setShowExternalForm: (show: boolean) => void;
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({
    userType,
    setUserType,
    search,
    setSearch,
    loading,
    searchInputRef,
    setError,
    setShowExternalForm
}) => {
    return (
        <PageHeader
            kicker="Administración Central - DIITRA"
            icon={Shield}
            title="Gestión Institucional"
            description="Control de acceso institucional y gestión de evaluadores pares externos."
        >

            <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                {userType === 'EXTERNO' && (
                    <button
                        onClick={() => { setError(''); setShowExternalForm(true); }}
                        className="btn-brand w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        <UserPlus size={14} /> Nuevo Externo
                    </button>
                )}

                <div className="bg-surface border border-border-thin p-1 rounded-lg flex overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setUserType('DOCENTE')}
                        className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'DOCENTE' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                    >
                        Docentes
                    </button>
                    <button
                        onClick={() => setUserType('ESTUDIANTE')}
                        className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'ESTUDIANTE' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                    >
                        Alumnos
                    </button>
                    <button
                        onClick={() => setUserType('EXTERNO')}
                        className={`flex-1 whitespace-nowrap flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${userType === 'EXTERNO' ? 'bg-surface-hover text-text-main shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                    >
                        <Globe size={12} /> Externos
                    </button>
                </div>

                <div className="relative group w-full md:w-80">
                    {loading ? (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand animate-spin">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : (
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                    )}
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={`Buscar en ${userType}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.currentTarget.blur();
                            }
                        }}
                        className="input-vercel !pl-10 !pr-16 !py-2.5 !text-xs uppercase tracking-wider !font-mono placeholder:!lowercase w-full"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    searchInputRef.current?.focus();
                                }}
                                className="pointer-events-auto text-text-dim hover:text-text-main p-0.5 rounded hover:bg-surface-hover transition-all"
                                title="Limpiar búsqueda"
                            >
                                <X size={12} />
                            </button>
                        )}
                        <span className="hidden sm:inline font-mono text-[10px] text-text-dim select-none">
                            /
                        </span>
                    </div>
                </div>
            </div>
        </PageHeader>
    );
};
