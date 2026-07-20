import React from 'react';
import { FolderOpen } from 'lucide-react';

// Re-export contracts for 100% backwards compatibility
export type {
    ProyectoResumen,
    EstadoConteo,
    ActividadReciente,
    DashboardStats,
    GrupoInvestigacion
} from './types/analytics.types';

// Custom Hooks & Subcomponents
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { useAnalyticsState } from './hooks/useAnalyticsState';

import { SkeletonDashboard } from './components/SkeletonDashboard';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AnalyticsFilters } from './components/AnalyticsFilters';
import { AnalyticsTabs } from './components/AnalyticsTabs';
import { AnalyticsOverviewTab } from './components/AnalyticsOverviewTab';
import { AnalyticsCacesTab } from './components/AnalyticsCacesTab';
import { AnalyticsProductsTab } from './components/AnalyticsProductsTab';

const AnalyticsPage: React.FC = () => {
    const {
        period,
        setPeriod,
        carrera,
        setCarrera,
        activeTab,
        setActiveTab,
        selectedChartSegment,
        setSelectedChartSegment,
        exporting,
        exportError,
        activeCacesCode,
        setActiveCacesCode,
        activeProjectUuid,
        setActiveProjectUuid,
        handleExportPdf
    } = useAnalyticsState();

    const {
        loading,
        refreshing,
        projects,
        stats,
        groups,
        processed,
        reload
    } = useAnalyticsData(period, carrera);

    if (loading) {
        return (
            <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto relative overflow-hidden space-y-6 pb-12 select-none">
                <SkeletonDashboard />
            </main>
        );
    }

    const {
        filteredProjects,
        linesData,
        proyectosPorEstado,
        budgetTotal,
        budgetExecuted,
        cacesIndicators,
        dbPeriods,
        dbCareers
    } = processed;

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto relative overflow-hidden space-y-6 pb-12 select-none">
            {/* Cabecera Principal */}
            <AnalyticsHeader
                refreshing={refreshing}
                exporting={exporting}
                exportError={exportError}
                onReload={reload}
                onExportPdf={handleExportPdf}
            />

            {/* Panel de Filtros Bento */}
            <AnalyticsFilters
                period={period}
                setPeriod={setPeriod}
                carrera={carrera}
                setCarrera={setCarrera}
                dbPeriods={dbPeriods}
                dbCareers={dbCareers}
            />

            {/* Navegación por Pestañas */}
            <AnalyticsTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* ZONA DE PROYECTOS VACÍOS (EMPTY STATE EXTREMO PREMIUM) */}
            {filteredProjects.length === 0 ? (
                <div className="bento-card static p-16 text-center space-y-4 flex flex-col items-center justify-center bg-surface/20">
                    <div className="p-4 bg-surface rounded-full border border-border-thin">
                        <FolderOpen size={32} className="text-text-dim/60" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-text-main tracking-tight">Sin registros en el corte</h3>
                        <p className="text-xs text-text-dim max-w-sm leading-relaxed">
                            No se encontraron proyectos de investigación registrados en el sistema para el periodo o carrera seleccionada.
                        </p>
                    </div>
                    <button
                        onClick={() => { setPeriod('TODOS'); setCarrera('TODAS'); }}
                        className="btn-vercel-secondary text-[9px]"
                    >
                        Restablecer Filtros
                    </button>
                </div>
            ) : (
                <>
                    {activeTab === 'general' && (
                        <AnalyticsOverviewTab
                            filteredProjects={filteredProjects}
                            allProjects={projects}
                            stats={stats}
                            groups={groups}
                            linesData={linesData}
                            proyectosPorEstado={proyectosPorEstado}
                            budgetTotal={budgetTotal}
                            budgetExecuted={budgetExecuted}
                            selectedChartSegment={selectedChartSegment}
                            setSelectedChartSegment={setSelectedChartSegment}
                        />
                    )}

                    {activeTab === 'caces' && (
                        <AnalyticsCacesTab
                            filteredProjects={filteredProjects}
                            cacesIndicators={cacesIndicators}
                            activeCacesCode={activeCacesCode}
                            setActiveCacesCode={setActiveCacesCode}
                        />
                    )}

                    {activeTab === 'productos' && (
                        <AnalyticsProductsTab
                            filteredProjects={filteredProjects}
                            activeProjectUuid={activeProjectUuid}
                            setActiveProjectUuid={setActiveProjectUuid}
                        />
                    )}
                </>
            )}
        </main>
    );
};

export default AnalyticsPage;
