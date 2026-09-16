import { Bug, HelpCircle } from 'lucide-react';

export const TIPO_OPTIONS = [
    { value: 'TODOS', label: 'Todos los tipos' },
    { value: 'ERROR', label: 'Algo no funciona' },
    { value: 'DUDA', label: 'Falta una opción' }
];

export const ESTADO_OPTIONS = [
    { value: 'TODOS', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'En espera' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'ATENDIDO', label: 'Resuelto' },
    { value: 'DESCARTADO', label: 'Cerrado' }
];

export const ESTADO_ROW_OPTIONS = [
    { value: 'PENDIENTE', label: 'En espera' },
    { value: 'EN_REVISION', label: 'En revisión' },
    { value: 'ATENDIDO', label: 'Resuelto' },
    { value: 'DESCARTADO', label: 'Cerrado' }
];

export const getTipoBadge = (tipo?: string) => {
    const t = tipo?.toUpperCase() || '';
    switch (t) {
        case 'ERROR':
            return (
                <span className="text-red-500 font-semibold text-[12.5px] flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-red-500" />
                    <span>Algo no funciona</span>
                </span>
            );
        case 'DUDA':
            return (
                <span className="text-amber-500 font-semibold text-[12.5px] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Falta una opción</span>
                </span>
            );
        default:
            return <span className="text-text-dim text-[12px] font-medium">{tipo || 'General'}</span>;
    }
};

export const getEstadoBadge = (estado?: string) => {
    const e = estado?.toUpperCase() || '';
    switch (e) {
        case 'PENDIENTE':
        case 'EN_ESPERA':
        case 'EN ESPERA':
            return (
                <span className="text-amber-500 font-semibold text-[12px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>En espera</span>
                </span>
            );
        case 'EN_REVISION':
        case 'EN REVISION':
            return (
                <span className="text-blue-500 font-semibold text-[12px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                    <span>En revisión</span>
                </span>
            );
        case 'ATENDIDO':
        case 'RESUELTO':
            return (
                <span className="text-emerald-500 font-semibold text-[12px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Resuelto</span>
                </span>
            );
        case 'DESCARTADO':
        case 'CERRADO':
            return (
                <span className="text-text-dim font-semibold text-[12px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-dim inline-block"></span>
                    <span>Cerrado</span>
                </span>
            );
        default:
            return <span className="text-text-dim text-[12px] font-medium">{estado || 'Sin estado'}</span>;
    }
};

export const getEstadoLabel = (estado?: string) => {
    const e = estado?.toUpperCase() || '';
    switch (e) {
        case 'PENDIENTE':
        case 'EN_ESPERA':
        case 'EN ESPERA':
            return 'En espera';
        case 'EN_REVISION':
        case 'EN REVISION':
            return 'En revisión';
        case 'ATENDIDO':
        case 'RESUELTO':
            return 'Resuelto';
        case 'DESCARTADO':
        case 'CERRADO':
            return 'Cerrado';
        default:
            return estado || '';
    }
};
