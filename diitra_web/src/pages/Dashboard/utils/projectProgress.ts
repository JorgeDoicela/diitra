export interface ProjectProgressInfo {
    percentage: number;
    label: string;
    badgeClass: string;
    badgeLabel: string;
    statusColor: string;
    stageDescription: string;
}

export interface ProjectDataForProgress {
    estado: string;
    total_informes?: number;
    informes_aprobados?: number;
    total_productos?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    tiempo_ejecucion?: string;
}

/**
 * Calcula de manera integral y profesional el estado y avance de un proyecto institucional.
 * Normaliza estados y entrega estilos visuales basados en Vercel Geist.
 */
export function getProjectProgress(p: ProjectDataForProgress): ProjectProgressInfo {
    const estadoRaw = (p.estado || '').trim();
    const estadoUpper = estadoRaw.toUpperCase();

    if (estadoUpper === 'FINALIZADO' || estadoUpper === 'CONCLUIDO') {
        return {
            percentage: 100,
            label: '100% Concluido',
            badgeClass: 'badge-vercel-success',
            badgeLabel: 'Finalizado',
            statusColor: 'var(--success)',
            stageDescription: 'Proyecto culminado exitosamente con productos registrados'
        };
    }

    if (estadoUpper === 'EN EJECUCIÓN' || estadoUpper === 'EN_EJECUCION' || estadoUpper === 'EJECUCION') {
        const total = p.total_informes ?? 0;
        const aprobados = p.informes_aprobados ?? 0;
        if (total > 0) {
            const pct = Math.min(100, Math.max(10, Math.round((aprobados / total) * 100)));
            return {
                percentage: pct,
                label: `${pct}% avance · ${aprobados}/${total} informes aprobados`,
                badgeClass: 'badge-vercel-info',
                badgeLabel: 'En Ejecución',
                statusColor: 'var(--info)',
                stageDescription: aprobados >= total ? 'Informes completados · Fase de cierre' : 'Seguimiento periódico de hitos e informes'
            };
        }
        return {
            percentage: 20,
            label: 'En marcha · Fase inicial',
            badgeClass: 'badge-vercel-info',
            badgeLabel: 'En Ejecución',
            statusColor: 'var(--info)',
            stageDescription: 'Plan de trabajo activo y cronograma en desarrollo'
        };
    }

    if (estadoUpper === 'APROBADO') {
        return {
            percentage: 15,
            label: 'Aprobado · Listo para inicio',
            badgeClass: 'badge-vercel-warning',
            badgeLabel: 'Aprobado',
            statusColor: 'var(--warning)',
            stageDescription: 'Dictamen favorable emitido por la comisión evaluadora'
        };
    }

    if (
        estadoUpper === 'EN REVISIÓN' ||
        estadoUpper === 'EN_REVISION' ||
        estadoUpper === 'ENVIADO' ||
        estadoUpper === 'PENDIENTE'
    ) {
        return {
            percentage: 10,
            label: 'En arbitraje · Evaluación técnica',
            badgeClass: 'badge-vercel-warning',
            badgeLabel: 'En Revisión',
            statusColor: 'var(--warning)',
            stageDescription: 'Propuesta en revisión por pares académicos o comisión'
        };
    }

    if (
        estadoUpper === 'EN CORRECCIÓN' ||
        estadoUpper === 'EN_CORRECCION' ||
        estadoUpper === 'SUBSANACION' ||
        estadoUpper === 'OBSERVADO'
    ) {
        return {
            percentage: 8,
            label: 'En corrección · Subsanar observaciones',
            badgeClass: 'badge-vercel-warning',
            badgeLabel: 'En Corrección',
            statusColor: 'var(--warning)',
            stageDescription: 'Requiere ajustes técnicos antes de re-evaluación'
        };
    }

    if (estadoUpper === 'BORRADOR' || estadoUpper === 'PREPROPUESTA') {
        return {
            percentage: 5,
            label: 'Borrador · Formulación técnica',
            badgeClass: 'badge-vercel-neutral',
            badgeLabel: 'Borrador',
            statusColor: 'var(--accents-5)',
            stageDescription: 'Formulación y redacción técnica en curso'
        };
    }

    if (estadoUpper === 'RECHAZADO' || estadoUpper === 'ANULADO') {
        return {
            percentage: 0,
            label: 'No admitido / Desestimado',
            badgeClass: 'badge-vercel-error',
            badgeLabel: estadoRaw || 'Rechazado',
            statusColor: 'var(--error)',
            stageDescription: 'Propuesta no aprobada o cancelada'
        };
    }

    return {
        percentage: 0,
        label: estadoRaw || 'Sin estado',
        badgeClass: 'badge-vercel-neutral',
        badgeLabel: estadoRaw || 'Registrado',
        statusColor: 'var(--accents-4)',
        stageDescription: 'Fase de registro institucional'
    };
}
