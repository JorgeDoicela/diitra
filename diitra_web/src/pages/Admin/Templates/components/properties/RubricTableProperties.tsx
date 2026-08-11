/**
 * @file RubricTableProperties.tsx
 * @description Componente plugin modular para la configuración de la Rúbrica de Calificación.
 * Mantiene la misma arquitectura y patrón de diseño que los demás plugins del editor de plantillas.
 */

import React from 'react';
import type { DocumentBlock } from '../../types';
import { RubricCriteriaPanel } from './RubricCriteriaPanel';

interface RubricTablePropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const RubricTableProperties: React.FC<RubricTablePropertiesProps> = ({
    block,
    onUpdateConfig,
}) => {
    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">
            {/* Opciones de visualización */}
            <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                    Opciones Visuales y Secciones del Documento
                </h5>
                {[
                    { key: 'mostrarDescripcionCriterio', label: 'Mostrar Descripción de Criterios', desc: 'Detalle de estándares de evaluación en la vista y PDF.' },
                    { key: 'mostrarObservacionesCriterio', label: 'Mostrar Observaciones del Revisor', desc: 'Comentarios individuales por cada criterio evaluado.' },
                    { key: 'mostrarConflictoInteres', label: 'Sección: Declaración de Conflicto de Interés', desc: 'Aviso formal de transparencia CACES.' },
                    { key: 'mostrarResumenPuntuacion', label: 'Sección: Tarjeta Resumen de Puntuación', desc: 'Métricas de nota total, porcentaje y dictamen.' },
                    { key: 'mostrarJustificacionRecomendacion', label: 'Sección: Fundamentación Técnica de Recomendación', desc: 'Campo de texto para la justificación del dictamen.' },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between border-b border-border-thin/10 pb-3 last:border-0 last:pb-0">
                        <div>
                            <label className="text-xs font-semibold text-text-main block">{label}</label>
                            <span className="text-[9px] text-text-dim block mt-0.5 leading-tight">{desc}</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={(block.config as any)[key] ?? true}
                            onChange={e => onUpdateConfig(block.id, key, e.target.checked)}
                            className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                        />
                    </div>
                ))}
            </div>

            {/* Administrador dinámico de Criterios */}
            <div className="border-t border-border-thin/20 pt-3 -mx-4">
                <RubricCriteriaPanel />
            </div>
        </div>
    );
};
