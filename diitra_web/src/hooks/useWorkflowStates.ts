import { useState, useEffect } from 'react';
import api from '../api/axios_config';

export interface WorkflowState {
    estado: string;
    etiqueta: string;
    color: string;
    esFinal: boolean;
    permiteInformes: boolean;
    permiteEgresos: boolean;
}

export interface EstadoConfigResult {
    label: string;
    badge: string;
    dot: string;
    style?: React.CSSProperties;
    dotStyle?: React.CSSProperties;
}

// Cache at module scope to share the API results across multiple mounts
let cachedStates: WorkflowState[] | null = null;
let fetchPromise: Promise<WorkflowState[]> | null = null;

function hexToRgb(hex: string) {
    if (!hex) return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const DEFAULT_ESTADO_CONFIGS: Record<string, { badge: string; dot: string }> = {
    'Borrador': { badge: 'badge-vercel-neutral', dot: 'dot-neutral' },
    'Enviado': { badge: 'badge-vercel-info', dot: 'dot-info' },
    'En Revisión': { badge: 'badge-vercel-warning', dot: 'dot-warning dot-pulse' },
    'Aprobado': { badge: 'badge-vercel-success', dot: 'dot-success' },
    'En Ejecución': { badge: 'badge-vercel-violet', dot: 'dot-brand dot-pulse' },
    'Finalizado': { badge: 'badge-vercel-success', dot: 'dot-success' },
    'Rechazado': { badge: 'badge-vercel-error', dot: 'dot-error' },
};

export const useWorkflowStates = () => {
    const [states, setStates] = useState<WorkflowState[]>(cachedStates || []);
    const [loading, setLoading] = useState(!cachedStates);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cachedStates) {
            setStates(cachedStates);
            setLoading(false);
            return;
        }

        if (!fetchPromise) {
            fetchPromise = api.get<WorkflowState[]>('/catalogs/workflow/estados')
                .then(res => {
                    cachedStates = res.data;
                    return res.data;
                })
                .catch(err => {
                    fetchPromise = null;
                    throw err;
                });
        }

        let isMounted = true;
        fetchPromise
            .then(data => {
                if (isMounted) {
                    setStates(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error('[DIITRA] Error fetching workflow states:', err);
                    setError('Error al cargar la configuración de estados del flujo de trabajo.');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const getEstadoConfig = (estadoName: string): EstadoConfigResult => {
        const dbState = states.find(s => s.estado.toLowerCase() === (estadoName || '').toLowerCase());
        const label = dbState ? dbState.etiqueta : (estadoName || '');

        const defaultCfg = DEFAULT_ESTADO_CONFIGS[estadoName];
        
        // If it's a default state and it doesn't have a customized color in db (or if db color matches standard), use the stylesheet classes
        const isCustomColor = dbState && dbState.color && 
            dbState.color.toUpperCase() !== '#94A3B8' && 
            dbState.color.toUpperCase() !== '#3291FF' && 
            dbState.color.toUpperCase() !== '#F5A623' && 
            dbState.color.toUpperCase() !== '#00E054' && 
            dbState.color.toUpperCase() !== '#C084FC' && 
            dbState.color.toUpperCase() !== '#FF3333';

        if (defaultCfg && !isCustomColor) {
            return {
                label,
                badge: defaultCfg.badge,
                dot: defaultCfg.dot
            };
        }

        // If it is dynamic (not in default config or has a custom color), build inline style using hex color
        const baseColor = dbState?.color || '#94A3B8';
        const rgb = hexToRgb(baseColor);
        
        const style: React.CSSProperties = {
            backgroundColor: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)` : 'rgba(148, 163, 184, 0.08)',
            borderColor: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)` : 'rgba(148, 163, 184, 0.2)',
            color: baseColor
        };

        const dotStyle: React.CSSProperties = {
            backgroundColor: baseColor
        };

        let dotClass = 'dot';
        const lowerName = (estadoName || '').toLowerCase();
        if (lowerName.includes('revisión') || lowerName.includes('ejecución') || lowerName.includes('progreso') || lowerName.includes('corrección')) {
            dotClass += ' dot-pulse';
        }

        return {
            label,
            badge: '',
            dot: dotClass,
            style,
            dotStyle
        };
    };

    return {
        states,
        loading,
        error,
        getEstadoConfig
    };
};
