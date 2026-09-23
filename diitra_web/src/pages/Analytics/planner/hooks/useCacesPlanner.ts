import { useState, useMemo, useCallback } from 'react';
import type { ProyectoResumen, DashboardStats } from '../../types/analytics.types';
import type { CacesPlannerSimulationParams } from '../types/cacesPlanner.types';
import { runCacesPlannerDiagnosis } from '../utils/cacesPlannerEngine';

export const useCacesPlanner = (
    projects: ProyectoResumen[],
    stats: DashboardStats | null
) => {
    const [params, setParams] = useState<CacesPlannerSimulationParams>({
        investigadoresOverride: null,
        extraArticulosScopus: 0,
        extraArticulosLatindex: 0,
        extraLibros: 0,
        extraPonencias: 0,
        extraPrototipos: 0,
        projectOverrides: {}
    });

    // Resetear todas las variables a los datos reales de la base de datos
    const resetSimulation = useCallback(() => {
        setParams({
            investigadoresOverride: null,
            extraArticulosScopus: 0,
            extraArticulosLatindex: 0,
            extraLibros: 0,
            extraPonencias: 0,
            extraPrototipos: 0,
            projectOverrides: {}
        });
    }, []);

    // Actualizar número de docentes investigadores
    const setInvestigadoresOverride = useCallback((val: number | null) => {
        setParams(prev => ({
            ...prev,
            investigadoresOverride: val !== null && !isNaN(val) ? Math.max(0, val) : null
        }));
    }, []);

    // Ajustar publicaciones simuladas por tipo
    const updateExtraProduct = useCallback((
        type: 'extraArticulosScopus' | 'extraArticulosLatindex' | 'extraLibros' | 'extraPonencias' | 'extraPrototipos',
        deltaOrValue: number,
        isDelta = false
    ) => {
        setParams(prev => {
            const current = prev[type];
            const nextVal = isDelta ? Math.max(0, current + deltaOrValue) : Math.max(0, deltaOrValue);
            return {
                ...prev,
                [type]: nextVal
            };
        });
    }, []);

    // Modificar el TRL de un proyecto específico en la simulación
    const setProjectTrlOverride = useCallback((idProyecto: number, trl: number) => {
        setParams(prev => {
            const currentOverride = prev.projectOverrides[idProyecto];
            const currentPartner = currentOverride?.simulatedEntidadAliada ?? 
                Boolean(projects.find(p => p.idProyecto === idProyecto)?.entidadAliada);

            return {
                ...prev,
                projectOverrides: {
                    ...prev.projectOverrides,
                    [idProyecto]: {
                        idProyecto,
                        simulatedTrl: Math.min(9, Math.max(1, trl)),
                        simulatedEntidadAliada: currentPartner
                    }
                }
            };
        });
    }, [projects]);

    // Alternar si un proyecto cuenta con convenio/entidad aliada en la simulación
    const toggleProjectPartnerOverride = useCallback((idProyecto: number) => {
        setParams(prev => {
            const proj = projects.find(p => p.idProyecto === idProyecto);
            const currentOverride = prev.projectOverrides[idProyecto];
            const currentPartner = currentOverride ? currentOverride.simulatedEntidadAliada : Boolean(proj?.entidadAliada);
            const currentTrl = currentOverride ? currentOverride.simulatedTrl : (proj?.trlActual || 1);

            return {
                ...prev,
                projectOverrides: {
                    ...prev.projectOverrides,
                    [idProyecto]: {
                        idProyecto,
                        simulatedTrl: currentTrl,
                        simulatedEntidadAliada: !currentPartner
                    }
                }
            };
        });
    }, [projects]);

    // Eliminar override individual de un proyecto
    const removeProjectOverride = useCallback((idProyecto: number) => {
        setParams(prev => {
            const nextOverrides = { ...prev.projectOverrides };
            delete nextOverrides[idProyecto];
            return {
                ...prev,
                projectOverrides: nextOverrides
            };
        });
    }, []);

    // Diagnóstico y dictamen reactivo memoizado
    const diagnosis = useMemo(() => {
        return runCacesPlannerDiagnosis(projects, stats, params);
    }, [projects, stats, params]);

    return {
        params,
        diagnosis,
        resetSimulation,
        setInvestigadoresOverride,
        updateExtraProduct,
        setProjectTrlOverride,
        toggleProjectPartnerOverride,
        removeProjectOverride
    };
};
