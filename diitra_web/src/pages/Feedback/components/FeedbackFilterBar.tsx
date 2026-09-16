import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { GeistSelect } from '../../../components/Common/GeistSelect';
import { TIPO_OPTIONS, ESTADO_OPTIONS } from './FeedbackBadges';

interface FeedbackFilterBarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    filtroTipo: string;
    onTipoChange: (t: string) => void;
    filtroEstado: string;
    onEstadoChange: (e: string) => void;
    placeholder?: string;
    totalResultados?: number;
    totalOriginal?: number;
}

export const FeedbackFilterBar: React.FC<FeedbackFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    filtroTipo,
    onTipoChange,
    filtroEstado,
    onEstadoChange,
    placeholder = 'Buscar por título, contenido, pantalla o #ID...',
    totalResultados,
    totalOriginal
}) => {
    const hasActiveFilters = searchQuery.trim() !== '' || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS';

    const handleClearFilters = () => {
        onSearchChange('');
        onTipoChange('TODOS');
        onEstadoChange('TODOS');
    };

    return (
        <div className="bento-card static p-3.5 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Input de Búsqueda Textual */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-bg-deep border border-border-thin rounded-lg text-text-main placeholder:text-text-dim/60 focus:outline-none focus:border-brand transition-colors"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main p-0.5 rounded transition-colors cursor-pointer"
                            title="Borrar búsqueda"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filtros desplegables GeistSelect */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    <div className="w-full sm:w-44">
                        <GeistSelect
                            value={filtroTipo}
                            onChange={(val) => onTipoChange(String(val))}
                            options={TIPO_OPTIONS}
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <GeistSelect
                            value={filtroEstado}
                            onChange={(val) => onEstadoChange(String(val))}
                            options={ESTADO_OPTIONS}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="btn-vercel-secondary text-[11.5px] px-2.5 py-1.5 flex items-center gap-1 cursor-pointer shrink-0 text-text-dim hover:text-text-main"
                            title="Restablecer filtros"
                        >
                            <X size={12} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Contador de resultados si hay filtros activos */}
            {hasActiveFilters && typeof totalResultados === 'number' && typeof totalOriginal === 'number' && (
                <div className="flex items-center justify-between text-[11px] font-mono text-text-dim pt-1 border-t border-border-thin">
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-brand" />
                        <span>Mostrando <strong>{totalResultados}</strong> de <strong>{totalOriginal}</strong> incidencias</span>
                    </div>
                    <span>Filtros activos</span>
                </div>
            )}
        </div>
    );
};
