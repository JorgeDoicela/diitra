import { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios_config';
import type {
    ProyectoResumen,
    DashboardStats,
    GrupoInvestigacion,
    ProcessedAnalyticsData,
    LineaInvestigacionData,
    EstadoConteo
} from '../types/analytics.types';
import { calculateCacesIndicators } from '../utils/cacesCalculator';

export const useAnalyticsData = (period: string, carrera: string) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [projects, setProjects] = useState<ProyectoResumen[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [groups, setGroups] = useState<GrupoInvestigacion[]>([]);
    const [allCareers, setAllCareers] = useState<any[]>([]);

    const loadData = async () => {
        setRefreshing(true);
        try {
            const [projectsRes, statsRes, groupsRes, careersRes] = await Promise.all([
                api.get('/projects'),
                api.get('/projects/stats'),
                api.get('/groups'),
                api.get('/catalogs/carreras')
            ]);

            if (projectsRes.data) setProjects(projectsRes.data);
            if (statsRes.data) setStats(statsRes.data);
            if (groupsRes.data) setGroups(groupsRes.data);
            if (careersRes.data) setAllCareers(careersRes.data);

        } catch (error) {
            console.error("[Analytics System API Error]", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ── PROCESAMIENTO REACTIVO DE CORTE (FILTROS) ──
    const processed: ProcessedAnalyticsData = useMemo(() => {
        // 1. Filtrar proyectos por periodo y carrera
        const filteredProjects = projects.filter(p => {
            const matchesPeriod = period === 'TODOS' || 
                (p.convocatoriaTitulo && p.convocatoriaTitulo.toLowerCase().includes(period.toLowerCase()));
            
            const matchesCarrera = carrera === 'TODAS' || 
                (p.carrera && p.carrera.toUpperCase() === carrera.toUpperCase());

            return matchesPeriod && matchesCarrera;
        });

        // 2. Recalcular las líneas de investigación prioritarias del corte
        const linesMap: Record<string, { proyectos: number; pres: number }> = {};
        filteredProjects.forEach(p => {
            const line = p.lineaInvestigacion || "Línea General / No Asignada";
            if (!linesMap[line]) linesMap[line] = { proyectos: 0, pres: 0 };
            linesMap[line].proyectos += 1;
            linesMap[line].pres += p.presupuestoTotal || 0;
        });

        const colors = ["bg-brand", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-red-500", "bg-indigo-500"];
        const linesData: LineaInvestigacionData[] = Object.entries(linesMap).map(([nombre, val], idx) => ({
            nombre,
            proyectos: val.proyectos,
            pres: val.pres,
            pct: (val.proyectos / (filteredProjects.length || 1)) * 100,
            colorClass: colors[idx % colors.length]
        })).sort((a, b) => b.proyectos - a.proyectos);

        // 3. Recalcular la distribución por estado del corte
        const stateColors: Record<string, string> = {
            "Borrador": "#6B7280",
            "Enviado": "#3B82F6",
            "En Revisión": "#F59E0B",
            "Aprobado": "#10B981",
            "En Ejecución": "#8B5CF6",
            "Finalizado": "#059669",
            "Rechazado": "#EF4444"
        };
        const counts: Record<string, number> = {};
        filteredProjects.forEach(p => {
            counts[p.estado] = (counts[p.estado] || 0) + 1;
        });
        const proyectosPorEstado: EstadoConteo[] = Object.entries(counts).map(([estado, cantidad]) => ({
            estado,
            cantidad,
            color: stateColors[estado] || "#6B7280"
        }));

        // 4. Calcular presupuesto acumulado
        const budgetTotal = filteredProjects.reduce((sum, p) => sum + (p.presupuestoTotal || 0), 0);
        const budgetExecuted = filteredProjects.reduce((sum, p) => sum + (p.presupuestoEjecutado || 0), 0);

        // 5. CACES compliance indicators
        const cacesIndicators = calculateCacesIndicators(filteredProjects, stats);

        // 6. Lista dinámica de periodos disponibles en la BD
        const dbPeriods = Array.from(new Set(
            projects.map(p => {
                const match = p.convocatoriaTitulo?.match(/\d{4}-(?:I|II)/i);
                return match ? match[0].toUpperCase() : p.convocatoriaTitulo;
            }).filter(Boolean)
        )) as string[];

        // 7. Lista dinámica de carreras que tienen proyectos en la BD
        const dbCareers = Array.from(new Set(
            projects.map(p => p.carrera).filter(Boolean)
        )) as string[];

        return {
            filteredProjects,
            linesData,
            proyectosPorEstado,
            budgetTotal,
            budgetExecuted,
            cacesIndicators,
            dbPeriods,
            dbCareers
        };

    }, [projects, stats, groups, period, carrera]);

    return {
        loading,
        refreshing,
        projects,
        stats,
        groups,
        allCareers,
        processed,
        reload: loadData
    };
};
