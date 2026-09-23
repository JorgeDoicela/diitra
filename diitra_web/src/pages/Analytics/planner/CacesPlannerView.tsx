import React from 'react';
import type { ProyectoResumen, DashboardStats } from '../../types/analytics.types';
import { useCacesPlanner } from './hooks/useCacesPlanner';
import { PlannerHeader } from './components/PlannerHeader';
import { FormulaProductionCard } from './components/FormulaProductionCard';
import { FormulaTrlCard } from './components/FormulaTrlCard';
import { PlannerDiagnosisCard } from './components/PlannerDiagnosisCard';

export interface CacesPlannerViewProps {
    filteredProjects: ProyectoResumen[];
    stats: DashboardStats | null;
    periodLabel?: string;
}

export const CacesPlannerView: React.FC<CacesPlannerViewProps> = ({
    filteredProjects,
    stats,
    periodLabel = 'Período Actual'
}) => {
    const {
        params,
        diagnosis,
        resetSimulation,
        setInvestigadoresOverride,
        updateExtraProduct,
        setProjectTrlOverride,
        toggleProjectPartnerOverride,
        removeProjectOverride
    } = useCacesPlanner(filteredProjects, stats);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Cabecera y controles de simulación */}
            <PlannerHeader
                isSimulating={diagnosis.esModoSimulado}
                onReset={resetSimulation}
                totalProjectsCount={filteredProjects.length}
                periodLabel={periodLabel}
            />

            {/* Diagnóstico y Dictamen Predictivo */}
            <PlannerDiagnosisCard diagnosis={diagnosis} />

            {/* Grid con las 2 Fórmulas CACES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {/* Fórmula 1: Producción Científica */}
                <FormulaProductionCard
                    f1={diagnosis.formula1}
                    params={params}
                    onUpdateProduct={updateExtraProduct}
                    onSetInvestigadoresOverride={setInvestigadoresOverride}
                />

                {/* Fórmula 2: Madurez Tecnológica TRL */}
                <FormulaTrlCard
                    f2={diagnosis.formula2}
                    projects={filteredProjects}
                    params={params}
                    onSetProjectTrlOverride={setProjectTrlOverride}
                    onToggleProjectPartnerOverride={toggleProjectPartnerOverride}
                    onRemoveProjectOverride={removeProjectOverride}
                />
            </div>
        </div>
    );
};
