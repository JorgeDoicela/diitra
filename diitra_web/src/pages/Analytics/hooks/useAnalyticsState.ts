import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reportService } from '../../../api/reportService';

export type AnalyticsTab = 'general' | 'caces' | 'productos';

export const useAnalyticsState = () => {
    const [period, setPeriod] = useState('TODOS');
    const [carrera, setCarrera] = useState('TODAS');
    const [searchParams, setSearchParams] = useSearchParams();

    const tabParam = searchParams.get('tab');
    const activeTab: AnalyticsTab = (tabParam === 'general' || tabParam === 'caces' || tabParam === 'productos')
        ? tabParam
        : 'general';

    const setActiveTab = (tab: AnalyticsTab) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        });
    };

    const [selectedChartSegment, setSelectedChartSegment] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [activeCacesCode, setActiveCacesCode] = useState<string>('E1.PLAN');
    const [activeProjectUuid, setActiveProjectUuid] = useState<string | null>(null);

    const handleExportPdf = async () => {
        setExporting(true);
        setExportError(null);
        try {
            await reportService.downloadAnalyticsReport(period, carrera);
        } catch (err: any) {
            console.error('[Analytics] Error exporting PDF:', err);
            setExportError(err?.response?.data?.error || err?.message || 'Error al generar el reporte');
            setTimeout(() => setExportError(null), 5000);
        } finally {
            setExporting(false);
        }
    };

    return {
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
    };
};
