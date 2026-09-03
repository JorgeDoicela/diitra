import React from 'react';
import { UserPlus, Search, X } from 'lucide-react';
import { PageHeader } from '../../../../components/Common/PageHeader';

interface UsersHeaderProps {
    userType: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
    setUserType: (type: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO') => void;
    soloConHoras: boolean;
    setSoloConHoras: (val: boolean) => void;
    estadoEstudiante: 'ACTIVO' | 'GRADUADO' | 'TODOS';
    setEstadoEstudiante: (val: 'ACTIVO' | 'GRADUADO' | 'TODOS') => void;
    origenEstudiante: 'INSTITUTO' | 'CONDUCCION' | 'TODOS';
    setOrigenEstudiante: (val: 'INSTITUTO' | 'CONDUCCION' | 'TODOS') => void;
    departamento: string;
    setDepartamento: (val: string) => void;
    availableDepartments?: string[];
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
    soloConHoras,
    setSoloConHoras,
    estadoEstudiante,
    setEstadoEstudiante,
    origenEstudiante,
    setOrigenEstudiante,
    departamento,
    setDepartamento,
    availableDepartments = [],
    search,
    setSearch,
    loading,
    searchInputRef,
    setError,
    setShowExternalForm
}) => {
    return (
        <PageHeader
            kicker="Administración Central"
            title="Gestión de Personal y Usuarios"
            description="Control de acceso, roles institucionales y evaluadores externos."
        >

            <div className="w-full lg:w-auto flex flex-col gap-3">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    {userType === 'EXTERNO' && (
                        <button
                            onClick={() => { setError(''); setShowExternalForm(true); }}
                            className="btn-brand w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <UserPlus size={14} /> Nuevo Externo
                        </button>
                    )}

                    {/* Tabs de Tipos Principales */}
                    <div className="bg-surface border border-border-thin p-1 rounded-lg flex overflow-x-auto custom-scrollbar w-full md:w-auto">
                        <button
                            onClick={() => setUserType('DOCENTE')}
                            className={`flex-1 whitespace-nowrap px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${userType === 'DOCENTE' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Docentes
                        </button>
                        <button
                            onClick={() => setUserType('ADMINISTRATIVO')}
                            className={`flex-1 whitespace-nowrap px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${userType === 'ADMINISTRATIVO' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Administrativos
                        </button>
                        <button
                            onClick={() => setUserType('ESTUDIANTE')}
                            className={`flex-1 whitespace-nowrap px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${userType === 'ESTUDIANTE' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Alumnos
                        </button>
                        <button
                            onClick={() => setUserType('EXTERNO')}
                            className={`flex-1 whitespace-nowrap px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${userType === 'EXTERNO' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                        >
                            Externos
                        </button>
                    </div>

                    {/* Buscador */}
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
                            placeholder={`Buscar en ${userType.toLowerCase()}...`}
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
                                    className="pointer-events-auto text-text-dim hover:text-text-main p-0.5 rounded hover:bg-surface-hover transition-all cursor-pointer"
                                    title="Limpiar búsqueda"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-text-dim bg-surface border border-border-thin rounded">
                                /
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Subfiltros Contextuales */}
                {userType === 'DOCENTE' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border-thin/40 text-[11px]">
                        <span className="text-text-dim font-medium">Asignación:</span>
                        <div className="bg-surface border border-border-thin p-0.5 rounded-lg flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setSoloConHoras(true)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${soloConHoras ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                            >
                                Con Horas de Investigación (CACES)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSoloConHoras(false)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${!soloConHoras ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                            >
                                Toda la Planta Docente
                            </button>
                        </div>
                    </div>
                )}

                {userType === 'ADMINISTRATIVO' && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border-thin/40 text-[11px]">
                        <div className="flex items-center gap-2">
                            <span className="text-text-dim font-medium">Departamento:</span>
                            <div className="relative min-w-[260px]">
                                <select
                                    value={departamento}
                                    onChange={(e) => setDepartamento(e.target.value)}
                                    className="input-vercel !py-1.5 !px-3 !text-xs !bg-surface font-medium cursor-pointer w-full text-text-main border-border-thin focus:border-brand"
                                >
                                    <option value="" className="bg-bg-deep text-text-main">
                                        Todos los Departamentos ({availableDepartments.length > 0 ? `${availableDepartments.length} disponibles` : 'Cargando...'})
                                    </option>
                                    {availableDepartments.map((dept) => (
                                        <option key={dept} value={dept} className="bg-bg-deep text-text-main">
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {departamento && (
                                <button
                                    type="button"
                                    onClick={() => setDepartamento('')}
                                    className="btn-vercel-secondary !py-1 !px-2 !text-[10px] flex items-center gap-1 cursor-pointer"
                                    title="Restablecer filtro"
                                >
                                    <X size={11} /> Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {userType === 'ESTUDIANTE' && (
                    <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border-thin/40 text-[11px]">
                        {/* Dependencia */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-text-dim font-medium">Dependencia:</span>
                            <div className="bg-surface border border-border-thin p-0.5 rounded-lg flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setOrigenEstudiante('INSTITUTO')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${origenEstudiante === 'INSTITUTO' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Instituto ISTPET
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrigenEstudiante('CONDUCCION')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${origenEstudiante === 'CONDUCCION' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Escuela de Conducción
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrigenEstudiante('TODOS')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${origenEstudiante === 'TODOS' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>

                        {/* Condición Académica */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-text-dim font-medium">Condición:</span>
                            <div className="bg-surface border border-border-thin p-0.5 rounded-lg flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setEstadoEstudiante('ACTIVO')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${estadoEstudiante === 'ACTIVO' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Matriculados Activos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEstadoEstudiante('GRADUADO')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${estadoEstudiante === 'GRADUADO' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Graduados / Egresados
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEstadoEstudiante('TODOS')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${estadoEstudiante === 'TODOS' ? 'bg-surface-hover text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageHeader>
    );
};
