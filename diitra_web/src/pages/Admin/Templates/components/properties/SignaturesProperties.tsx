import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DocumentBlock, Signatory } from '../../types';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const defaultSignatory = (): Signatory => ({
    label: 'Elaborado por:',
    name: '[Título abreviado, Nombre Completo]',
    role: '[Cargo Institucional]',
});

export const SignaturesProperties: React.FC<Props> = ({ block, onUpdateConfig }) => {
    const signatories: Signatory[] = block.config.signatories ?? [
        { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
        { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
    ];

    const update = (next: Signatory[]) => onUpdateConfig(block.id, 'signatories', next);

    const updateSignatory = (idx: number, key: keyof Signatory, val: string) => {
        update(signatories.map((s, i) => i === idx ? { ...s, [key]: val } : s));
    };

    const addSignatory = () => update([...signatories, defaultSignatory()]);
    const removeSignatory = (idx: number) => update(signatories.filter((_, i) => i !== idx));

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">
            <div className="space-y-3">
                {signatories.map((sig, idx) => (
                    <div key={idx} className="p-3 border border-border-thin rounded-md bg-surface-hover/20 space-y-2 relative group/sig">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">
                                Firmante #{idx + 1}
                            </span>
                            {signatories.length > 1 && (
                                <button
                                    onClick={() => removeSignatory(idx)}
                                    className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors opacity-0 group-hover/sig:opacity-100"
                                    title="Eliminar firmante"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-dim uppercase block">Etiqueta</label>
                            <input
                                value={sig.label}
                                onChange={e => updateSignatory(idx, 'label', e.target.value)}
                                placeholder="Elaborado por:"
                                className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-dim uppercase block">Nombre / Placeholder</label>
                            <input
                                value={sig.name}
                                onChange={e => updateSignatory(idx, 'name', e.target.value)}
                                placeholder="[Título, Nombre Completo]"
                                className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-dim uppercase block">Cargo</label>
                            <input
                                value={sig.role}
                                onChange={e => updateSignatory(idx, 'role', e.target.value)}
                                placeholder="Coordinador de Carrera"
                                className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={addSignatory}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-border-thin text-[10px] font-semibold text-text-dim hover:text-text-main hover:border-border-hover bg-surface hover:bg-surface-hover transition-all cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" />
                Añadir Firmante
            </button>

            <div className="space-y-1.5 border-t border-border-thin/15 pt-3">
                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">
                    Texto Pie de Página Institucional
                </label>
                <input
                    value={block.config.textoPieFirma ?? ''}
                    onChange={e => onUpdateConfig(block.id, 'textoPieFirma', e.target.value)}
                    placeholder="Comisión de Acreditación e Investigación IST Traversari"
                    className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none"
                />
            </div>
        </div>
    );
};
