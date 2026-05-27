import api from './axios_config';

export const reportService = {
    async downloadAnalyticsReport(period?: string, carrera?: string): Promise<void> {
        const params = new URLSearchParams();
        if (period && period !== 'TODOS') params.append('period', period);
        if (carrera && carrera !== 'TODAS') params.append('carrera', carrera);

        const response = await api.get(`/reports/analiticas?${params.toString()}`, {
            responseType: 'blob',
            timeout: 60000
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                link.download = match[1].replace(/['"]/g, '');
            }
        }

        if (!link.download) {
            const dateStr = new Date().toISOString().slice(0, 10);
            const periodStr = period && period !== 'TODOS' ? `_${period.replace(/\s+/g, '-')}` : '';
            const carreraStr = carrera && carrera !== 'TODAS' ? `_${carrera.replace(/\s+/g, '-')}` : '';
            link.download = `Reporte_Analiticas_ISTPET${periodStr}${carreraStr}_${dateStr}.pdf`;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};