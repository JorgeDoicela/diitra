/**
 * @file ArbitrationDictamenProperties.tsx
 * @description Componente plugin modular para la configuración visual del Acta de Dictamen de Arbitraje.
 * Permite al administrador habilitar o deshabilitar secciones del dictamen consolidado CACES/CES.
 */

import React from 'react';
import type { DocumentBlock } from '../../types';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

export const ArbitrationDictamenProperties: React.FC<Props> = ({
    block,
    onUpdateConfig,
}) => {
    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">
            <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                    Secciones del Dictamen Consolidado
                </h5>
                {[
                    { key: 'mostrarAvisoDobleCiego', label: 'Aviso de Doble Ciego (Art. 10 RRA CES)', desc: 'Declaración de confidencialidad de identidad de los árbitros.' },
                    { key: 'mostrarDatosProyectoDictamen', label: '1. Datos del Proyecto Evaluado', desc: 'Resumen con código institucional, título, convocatoria y fechas.' },
                    { key: 'mostrarPanelArbitros', label: '2. Panel de Árbitros Evaluadores', desc: 'Matriz anonimizada con el desglose de puntajes y dictámenes por árbitro.' },
                    { key: 'mostrarTarjetaResolucion', label: '3. Resolución Final del Panel', desc: 'Tarjeta central con nota promedio ponderada y dictamen (Aprobado/Rechazado/Desempate).' },
                    { key: 'mostrarObservacionesConsolidadas', label: '4. Observaciones Consolidadas del Panel', desc: 'Comentarios de respaldo cualitativo aportados por los revisores.' },
                    { key: 'mostrarCertificacionInstitucional', label: '5. Certificación e Identificador Legal', desc: 'Cláusula de validez vinculante DIITRA y sello institucional.' },
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
        </div>
    );
};
