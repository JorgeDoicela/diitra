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
        <div className="border-t border-border-thin/20 pt-3 -mx-4">
            <RubricCriteriaPanel />
        </div>
    );
};
