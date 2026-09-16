import { useState, useMemo } from 'react';
import type { FeedbackReporte } from '../../../services/feedbackService';

export const useFeedbackFilters = (reportes: FeedbackReporte[]) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    const filteredReportes = useMemo(() => {
        return reportes.filter(r => {
            // Filtro por tipo
            if (filtroTipo !== 'TODOS') {
                const tipoR = (r.tipo || '').toUpperCase();
                if (tipoR !== filtroTipo.toUpperCase()) return false;
            }

            // Filtro por estado
            if (filtroEstado !== 'TODOS') {
                const estR = (r.estado || '').toUpperCase();
                const targetEst = filtroEstado.toUpperCase();
                if (targetEst === 'PENDIENTE') {
                    if (estR !== 'PENDIENTE' && estR !== 'EN_ESPERA' && estR !== 'EN ESPERA') return false;
                } else if (targetEst === 'EN_REVISION') {
                    if (estR !== 'EN_REVISION' && estR !== 'EN REVISION') return false;
                } else if (targetEst === 'ATENDIDO') {
                    if (estR !== 'ATENDIDO' && estR !== 'RESUELTO') return false;
                } else if (targetEst === 'DESCARTADO') {
                    if (estR !== 'DESCARTADO' && estR !== 'CERRADO') return false;
                } else {
                    if (estR !== targetEst) return false;
                }
            }

            // Filtro por texto libre
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase().trim();
                const idStr = String(r.id_feedback || r.idFeedback || '');
                const titulo = (r.titulo || '').toLowerCase();
                const descripcion = (r.descripcion || '').toLowerCase();
                const autor = (r.nombre_usuario || r.nombreUsuario || '').toLowerCase();
                const cedula = (r.cedula || '').toLowerCase();
                const ruta = (r.ruta_origen || r.rutaOrigen || '').toLowerCase();

                const matches = idStr.includes(q)
                    || titulo.includes(q)
                    || descripcion.includes(q)
                    || autor.includes(q)
                    || cedula.includes(q)
                    || ruta.includes(q);

                if (!matches) return false;
            }

            return true;
        });
    }, [reportes, searchQuery, filtroTipo, filtroEstado]);

    const hasActiveFilters = searchQuery.trim() !== '' || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS';

    const clearFilters = () => {
        setSearchQuery('');
        setFiltroTipo('TODOS');
        setFiltroEstado('TODOS');
    };

    return {
        searchQuery,
        setSearchQuery,
        filtroTipo,
        setFiltroTipo,
        filtroEstado,
        setFiltroEstado,
        filteredReportes,
        hasActiveFilters,
        clearFilters
    };
};
