import React from 'react';
import { Target } from 'lucide-react';
import type { DocumentBlock } from '../../types';

interface ExpectedProductsPropertiesProps {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const inputCls = "w-full text-[11px] bg-surface-hover/60 hover:bg-surface-hover/90 border border-border-thin rounded-md p-2 text-text-main focus:bg-surface focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all focus:outline-none";

export const ExpectedProductsProperties: React.FC<ExpectedProductsPropertiesProps> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4 text-left">
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Target size={13} className="text-brand" />
                    Configuración de Productos Esperados
                </h5>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Título de la Sección</label>
                    <input
                        type="text"
                        className={inputCls}
                        value={config.productosTitle || '5. Productos Esperados'}
                        onChange={e => onUpdateConfig(block.id, 'productosTitle', e.target.value)}
                        placeholder="Ej: 5. Productos y Entregables del Proyecto"
                    />
                </div>
                <p className="text-[9px] text-text-dim leading-relaxed">
                    Este bloque genera dinámicamente la tabla donde los investigadores especifican los entregables planificados (artículos científicos, ponencias, prototipos, etc.).
                </p>
            </div>
        </div>
    );
};
