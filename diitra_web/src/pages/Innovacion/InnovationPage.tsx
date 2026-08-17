import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/Common/PageHeader';
import {
    Plus,
    Search,
    Sparkles,
    Loader2,
    Target,
    AlertCircle,
    Lightbulb,
    Layers
} from 'lucide-react';
import { useInnovation } from './hooks/useInnovation';
import { InnovationAssetCard } from './components/InnovationAssetCard';
import { RegisterAssetModal } from './components/RegisterAssetModal';
import { InnovationProjectsTab } from './components/InnovationProjectsTab';

const InnovationPage: React.FC = () => {
    const { assets, loading, refreshing, error, reload } = useInnovation();
    const [activeTab, setActiveTab] = useState<'proyectos' | 'activos'>('proyectos');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [projectsCount, setProjectsCount] = useState<number>(0);

    // Filtros y ordenamiento
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<string>('recientes');
    const [trlFilter, setTrlFilter] = useState<string>('todos');
    const [tipoFilter, setTipoFilter] = useState<string>('todos');
    const [senadiFilter, setSenadiFilter] = useState<string>('todos');

    const hasActiveFilters = search !== '' || trlFilter !== 'todos' || tipoFilter !== 'todos' || senadiFilter !== 'todos' || sortBy !== 'recientes';

    // Filtrado y ordenamiento de activos
    const filteredAssets = useMemo(() => {
        let result = assets.filter((a) => {
            const matchesSearch = !search.trim() ||
                a.titulo.toLowerCase().includes(search.toLowerCase()) ||
                (a.proyecto_titulo && a.proyecto_titulo.toLowerCase().includes(search.toLowerCase())) ||
                (a.numero_registro && a.numero_registro.toLowerCase().includes(search.toLowerCase()));

            const matchesTrl = trlFilter === 'todos' ||
                (trlFilter === 'concepto' && (a.trl_actual ?? 0) <= 3) ||
                (trlFilter === 'prototipo' && (a.trl_actual ?? 0) >= 4 && (a.trl_actual ?? 0) <= 6) ||
                (trlFilter === 'operativo' && (a.trl_actual ?? 0) >= 7);

            const matchesTipo = tipoFilter === 'todos' ||
                a.tipo_propiedad_intelectual === tipoFilter ||
                a.categoria_producto === tipoFilter;

            const matchesSenadi = senadiFilter === 'todos' ||
                (senadiFilter === 'sin_registro' && (!a.estado_senadi || a.estado_senadi === 'NoAplica')) ||
                a.estado_senadi === senadiFilter;

            return matchesSearch && matchesTrl && matchesTipo && matchesSenadi;
        });

        // Ordenamiento
        if (sortBy === 'trl_mayor') {
            result.sort((a, b) => (b.trl_actual ?? 0) - (a.trl_actual ?? 0));
        } else if (sortBy === 'titulo') {
            result.sort((a, b) => a.titulo.localeCompare(b.titulo));
        } else if (sortBy === 'convenios') {
            result.sort((a, b) => (b.total_transferencias ?? 0) - (a.total_transferencias ?? 0));
        } else {
            // Recientes por ID
            result.sort((a, b) => b.id_producto - a.id_producto);
        }

        return result;
    }, [assets, search, trlFilter, tipoFilter, senadiFilter, sortBy]);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-8 animate-fade-up">
            {/* Header del Módulo */}
            <PageHeader
                kicker="Módulo Institucional ISTPET"
                icon={Sparkles}
                title="Innovación y Transferencia Tecnológica"
                description={
                    <span className="flex flex-col md:flex-row md:items-center gap-x-2 gap-y-1">
                        <span>
                            Gestione proyectos de innovación oficial ISTPET, prototipos TRL, propiedad intelectual (SENADI) y convenios CTT.
                        </span>
                        {refreshing && (
                            <span className="flex items-center gap-1 text-brand text-[10px] uppercase tracking-wider font-mono animate-pulse shrink-0">
                                <Loader2 className="animate-spin" size={10} />
                                Sincronizando...
                            </span>
                        )}
                    </span>
                }
            >
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    {activeTab === 'activos' && (
                        <button
                            onClick={() => setIsRegisterOpen(true)}
                            className="btn-vercel-primary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span>Nuevo Activo / Prototipo</span>
                        </button>
                    )}
                </div>
            </PageHeader>

            {/* Pestañas de Navegación del Módulo */}
            <div className="flex items-center gap-2 border-b border-border-thin pb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('proyectos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'proyectos'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-text-dim hover:text-text-main hover:bg-surface'
                    }`}
                >
                    <Lightbulb size={15} />
                    <span>Proyectos de Innovación e i+TT</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                        activeTab === 'proyectos' ? 'bg-white/20 text-white' : 'bg-surface border border-border-thin text-text-dim'
                    }`}>
                        {projectsCount}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('activos')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'activos'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-text-dim hover:text-text-main hover:bg-surface'
                    }`}
                >
                    <Sparkles size={15} />
                    <span>Banco de Activos & Prototipos TRL</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                        activeTab === 'activos' ? 'bg-white/20 text-white' : 'bg-surface border border-border-thin text-text-dim'
                    }`}>
                        {assets.length}
                    </span>
                </button>
            </div>

            {/* Renderizado de la Pestaña Activa */}
            {activeTab === 'proyectos' ? (
                <InnovationProjectsTab 
                    onCountChange={(cnt) => setProjectsCount(cnt)}
                />
            ) : (
                <>
                <div className="flex flex-col gap-4 mb-8 animate-fade-up [animation-delay:50ms] bg-surface p-5 rounded-2xl border border-border-thin shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por título, proyecto de origen, código o nro. SENADI..."
                                className="input-vercel !pl-10 !rounded-xl !py-2.5 !text-sm !placeholder:text-text-dim w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="input-vercel !rounded-xl !py-2.5 !text-sm min-w-[160px] cursor-pointer"
                            >
                                <option value="recientes">Más recientes</option>
                                <option value="trl_mayor">Mayor madurez TRL</option>
                                <option value="convenios">Más convenios CTT</option>
                                <option value="titulo">Título (A-Z)</option>
                            </select>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setTrlFilter('todos');
                                        setTipoFilter('todos');
                                        setSenadiFilter('todos');
                                        setSortBy('recientes');
                                    }}
                                    className="btn-vercel-secondary !py-2.5 !px-4 !rounded-xl !text-xs whitespace-nowrap hover:bg-surface-hover hover:text-text-main transition-all cursor-pointer"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-thin">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">
                                Madurez Tecnológica (TRL)
                            </label>
                            <select
                                value={trlFilter}
                                onChange={(e) => setTrlFilter(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
                            >
                                <option value="todos">Todos los TRL</option>
                                <option value="concepto">TRL 1-3 (Concepto / Laboratorio)</option>
                                <option value="prototipo">TRL 4-6 (Prototipos Validados)</option>
                                <option value="operativo">TRL 7-9 (Operativos / Transferibles)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">
                                Tipo de Activo Intelectual
                            </label>
                            <select
                                value={tipoFilter}
                                onChange={(e) => setTipoFilter(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
                            >
                                <option value="todos">Todos los tipos de activo</option>
                                <option value="Software">Software / Soporte Lógico</option>
                                <option value="ModeloUtilidad">Modelo de Utilidad</option>
                                <option value="DisenoIndustrial">Diseño Industrial</option>
                                <option value="Patente">Patente de Invención</option>
                                <option value="Marca">Signo Distintivo / Marca</option>
                                <option value="SecretoIndustrial">Secreto Industrial</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-text-dim uppercase tracking-wider pl-1">
                                Estado SENADI (Propiedad Intelectual)
                            </label>
                            <select
                                value={senadiFilter}
                                onChange={(e) => setSenadiFilter(e.target.value)}
                                className="input-vercel !rounded-xl !py-2 !text-xs w-full cursor-pointer"
                            >
                                <option value="todos">Todos los estados SENADI</option>
                                <option value="Concedido">Título Concedido</option>
                                <option value="EnExamen">En Examen</option>
                                <option value="Solicitado">Trámite Iniciado</option>
                                <option value="sin_registro">Sin Registro SENADI</option>
                            </select>
                        </div>
                    </div>
                </div>

            {/* ── LISTADO O SKELETON RESPONSIVE (3 COLUMNAS) ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-text-dim" size={32} />
                </div>
            ) : !error && filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-up">
                    <div className="icon-circle !p-4 bg-surface mb-6">
                        <Target size={28} className="text-text-dim" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-main tracking-tight mb-2">
                        {hasActiveFilters ? 'Sin resultados para la búsqueda' : 'Aún no hay activos de innovación registrados'}
                    </h3>
                    <p className="text-sm text-text-dim max-w-xs mb-6">
                        {hasActiveFilters
                            ? 'Prueba modificando los filtros de búsqueda o TRL.'
                            : 'Registra los primeros prototipos, software o modelos de utilidad generados por los proyectos.'}
                    </p>
                    {!hasActiveFilters && (
                        <button
                            onClick={() => setIsRegisterOpen(true)}
                            className="btn-vercel-primary h-10 px-6 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Registrar Primer Activo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => (
                        <InnovationAssetCard
                            key={asset.id_producto}
                            asset={asset}
                        />
                    ))}
                </div>
            )}
            </>
            )}

            {/* Modal de Registro de Activo */}
            <RegisterAssetModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSuccess={() => reload()}
            />
        </main>
    );
};

export default InnovationPage;
