import React, { useState } from 'react';
import { 
    Calendar, BookOpen, Plus, Search, Settings2, Tag, Globe, BarChart2
} from 'lucide-react';
import { useConfiguracion } from './Configuracion/useConfiguracion';
import { LineasTab } from './Configuracion/LineasTab';
import { PeriodosTab } from './Configuracion/PeriodosTab';
import { ProductosTab } from './Configuracion/ProductosTab';
import { DominiosTab } from './Configuracion/DominiosTab';
import { IndicadoresTab } from './Configuracion/IndicadoresTab';
import { CalendarioTab } from './Configuracion/CalendarioTab';
import { ConfiguracionDetailDrawer } from './Configuracion/ConfiguracionDetailDrawer';

interface ConfiguracionPageProps {
    embedded?: boolean;
}

const ConfiguracionPage: React.FC<ConfiguracionPageProps> = ({ embedded = false }) => {
    const hook = useConfiguracion();
    const {
        activeTab,
        setActiveTab,
        search,
        setSearch,
        handleOpenLineaModal,
        handleOpenPeriodoModal,
        handleOpenProductoModal,
        handleOpenDominioModal,
        handleOpenIndicadorModal,
        handleOpenCalendarioModal
    } = hook;

    const [detailItem, setDetailItem] = useState<{
        type: 'linea' | 'periodo' | 'producto' | 'dominio' | 'indicador' | 'calendario';
        data: any;
    } | null>(null);

    return (
        <main className={`flex-1 ${embedded ? '' : 'bg-bg-deep p-4 md:p-10 overflow-y-auto'}`}>
            <header className={`flex flex-col lg:flex-row ${embedded ? 'justify-end mb-6' : 'justify-between mb-10 lg:mb-16'} items-start lg:items-end animate-fade-up gap-8 lg:gap-0`}>
                {!embedded && (
                    <div className="space-y-2">
                        <div className="section-label text-text-main">
                            <Settings2 size={10} className="text-text-main animate-spin-slow" />
                            <span>Catálogos Institucionales</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight uppercase">
                            Configuración del Sistema
                        </h1>
                        <p className="text-xs text-text-dim max-w-md leading-relaxed">
                            Mantenimiento de parámetros globales, periodos de acreditación, líneas Unesco y calendarios académicos oficiales.
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar parámetro..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-vercel pl-9 w-full"
                        />
                    </div>
                    {activeTab === 'lineas' && (
                        <button 
                            onClick={() => handleOpenLineaModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nueva Línea
                        </button>
                    )}
                    {activeTab === 'periodos' && (
                        <button 
                            onClick={() => handleOpenPeriodoModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Período
                        </button>
                    )}
                    {activeTab === 'productos' && (
                        <button 
                            onClick={() => handleOpenProductoModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Tipo
                        </button>
                    )}
                    {activeTab === 'dominios' && (
                        <button 
                            onClick={() => handleOpenDominioModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Dominio
                        </button>
                    )}
                    {activeTab === 'indicadores' && (
                        <button 
                            onClick={() => handleOpenIndicadorModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Indicador
                        </button>
                    )}
                    {activeTab === 'calendario' && (
                        <button 
                            onClick={() => handleOpenCalendarioModal()}
                            className="btn-vercel-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Nuevo Hito
                        </button>
                    )}
                </div>
            </header>

            <div className="tabs-vercel">
                <button
                    onClick={() => { setActiveTab('lineas'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'lineas' ? 'active' : ''
                    }`}
                >
                    <BookOpen size={14} />
                    <span>Líneas de Investigación</span>
                </button>
                <button
                    onClick={() => { setActiveTab('periodos'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'periodos' ? 'active' : ''
                    }`}
                >
                    <Calendar size={14} />
                    <span>Períodos Académicos</span>
                </button>
                <button
                    onClick={() => { setActiveTab('productos'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'productos' ? 'active' : ''
                    }`}
                >
                    <Tag size={14} />
                    <span>Tipos de Productos</span>
                </button>
                <button
                    onClick={() => { setActiveTab('dominios'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'dominios' ? 'active' : ''
                    }`}
                >
                    <Globe size={14} />
                    <span>Dominios Académicos</span>
                </button>
                <button
                    onClick={() => { setActiveTab('indicadores'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'indicadores' ? 'active' : ''
                    }`}
                >
                    <BarChart2 size={14} />
                    <span>Indicadores CACES</span>
                </button>
                <button
                    onClick={() => { setActiveTab('calendario'); setSearch(''); }}
                    className={`tab-vercel-item flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                        activeTab === 'calendario' ? 'active' : ''
                    }`}
                >
                    <Calendar size={14} />
                    <span>Hitos de Calendario</span>
                </button>
            </div>

            <div className="bento-card table-container overflow-x-auto min-h-[400px]">
                {activeTab === 'lineas' && (
                    <LineasTab hook={hook} setDetailItem={setDetailItem} />
                )}
                {activeTab === 'periodos' && (
                    <PeriodosTab hook={hook} setDetailItem={setDetailItem} />
                )}
                {activeTab === 'productos' && (
                    <ProductosTab hook={hook} setDetailItem={setDetailItem} />
                )}
                {activeTab === 'dominios' && (
                    <DominiosTab hook={hook} setDetailItem={setDetailItem} />
                )}
                {activeTab === 'indicadores' && (
                    <IndicadoresTab hook={hook} setDetailItem={setDetailItem} />
                )}
                {activeTab === 'calendario' && (
                    <CalendarioTab hook={hook} setDetailItem={setDetailItem} />
                )}
            </div>

            {/* Shared Detail Drawer */}
            <ConfiguracionDetailDrawer 
                detailItem={detailItem} 
                setDetailItem={setDetailItem} 
                hook={hook} 
            />
        </main>
    );
};

export default ConfiguracionPage;