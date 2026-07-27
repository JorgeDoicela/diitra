import React from 'react';
import { RichTextEditor } from './RichTextEditor';
import type { DocumentBlock } from '../../types';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const HEADER_STYLE_OPTIONS = [
    { value: 'blue', label: '🔵 Azul Institucional' },
    { value: 'gold', label: '🟡 Dorado Acreditación' },
    { value: 'gray', label: '⬜ Gris Neutro' },
    { value: 'none', label: '— Sin fondo' },
] as const;

export const TwoColumnProperties: React.FC<Props> = ({ block, onUpdateConfig }) => {
    return (
        <div className="space-y-5 border-t border-border-thin/20 pt-4">

            {/* Comportamiento en Workspace */}
            <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    Comportamiento en Workspace
                </h5>
                <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                        <label className="text-[10px] font-bold text-text-main block">¿Editable en Workspace?</label>
                        <span className="text-[8.5px] text-text-dim block mt-0.5 leading-tight">
                            Habilita una pestaña con dos columnas de redacción colaborativa en el Workspace.
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={block.config.isEditableWorkspace !== false}
                        onChange={e => onUpdateConfig(block.id, 'isEditableWorkspace', e.target.checked)}
                        className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer"
                    />
                </div>
            </div>

            {/* Columna Izquierda */}
            <div className="space-y-3 p-3 border border-border-thin rounded-md bg-surface-hover/20">
                <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                    ◀ Columna Izquierda
                </p>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Título</label>
                    <input
                        value={block.config.leftTitle ?? ''}
                        onChange={e => onUpdateConfig(block.id, 'leftTitle', e.target.value)}
                        placeholder="Ej: OBJETIVOS GENERALES"
                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Estilo de Encabezado</label>
                    <select
                        value={block.config.leftHeaderStyle ?? 'blue'}
                        onChange={e => onUpdateConfig(block.id, 'leftHeaderStyle', e.target.value)}
                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                    >
                        {HEADER_STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Contenido</label>
                    <RichTextEditor
                        block={{ ...block, config: { ...block.config, html: block.config.leftContent } }}
                        fieldKey="html"
                        placeholder="Contenido de la columna izquierda..."
                        onUpdateConfig={(_, __, val) => onUpdateConfig(block.id, 'leftContent', val)}
                    />
                </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3 p-3 border border-border-thin rounded-md bg-surface-hover/20">
                <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                    ▶ Columna Derecha
                </p>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Título</label>
                    <input
                        value={block.config.rightTitle ?? ''}
                        onChange={e => onUpdateConfig(block.id, 'rightTitle', e.target.value)}
                        placeholder="Ej: OBJETIVOS ESPECÍFICOS"
                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Estilo de Encabezado</label>
                    <select
                        value={block.config.rightHeaderStyle ?? 'blue'}
                        onChange={e => onUpdateConfig(block.id, 'rightHeaderStyle', e.target.value)}
                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                    >
                        {HEADER_STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-text-dim uppercase block">Contenido</label>
                    <RichTextEditor
                        block={{ ...block, config: { ...block.config, html: block.config.rightContent } }}
                        fieldKey="html"
                        placeholder="Contenido de la columna derecha..."
                        onUpdateConfig={(_, __, val) => onUpdateConfig(block.id, 'rightContent', val)}
                    />
                </div>
            </div>

        </div>
    );
};
