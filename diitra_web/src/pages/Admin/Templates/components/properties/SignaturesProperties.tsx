import React from 'react';
import { Reorder, motion } from 'framer-motion';
import { Plus, Trash2, Users, PenTool, GripVertical } from 'lucide-react';
import type { DocumentBlock, Signatory, SignaturesMode } from '../../types';

interface Props {
    block: DocumentBlock;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

interface DynamicSignerItem {
    id: string;
    label: string;
    desc: string;
    configKey: string;
    defaultChecked: boolean;
}

const DYNAMIC_SIGNERS: DynamicSignerItem[] = [
    { id: 'director', label: 'Director del Proyecto', desc: 'Firma del docente responsable principal.', configKey: 'includeDirector', defaultChecked: true },
    { id: 'docentes', label: 'Docentes Investigadores', desc: 'Genera una firma por cada docente miembro del equipo.', configKey: 'includeDocentes', defaultChecked: true },
    { id: 'estudiantes', label: 'Estudiantes / Auxiliares', desc: 'Incluye a los estudiantes miembros del proyecto si existen.', configKey: 'includeEstudiantes', defaultChecked: false },
    { id: 'coordinador_carrera', label: 'Coordinador de Carrera', desc: 'Casilla de revisión académica de la carrera.', configKey: 'includeCoordinadorCarrera', defaultChecked: true },
    { id: 'coordinador_diitra', label: 'Coordinación de Investigación (DIITRA)', desc: 'Aprobación formal de la Dirección de Investigación.', configKey: 'includeCoordinadorDiitra', defaultChecked: false },
    { id: 'vicerrectorado', label: 'Vicerrectorado / Rectorado', desc: 'Resolución institucional máxima si el documento lo exige.', configKey: 'includeVicerrectorado', defaultChecked: false },
];

const defaultSignatory = (): Signatory => ({
    label: 'Elaborado por:',
    name: '[Título abreviado, Nombre Completo]',
    role: '[Cargo Institucional]',
});

export const SignaturesProperties: React.FC<Props> = ({ block, onUpdateConfig }) => {
    const config = block.config || {};
    const mode: SignaturesMode = config.signaturesMode || 'team_dynamic';

    const signatories: Signatory[] = (config.signatories ?? [
        { label: 'Elaborado por:', name: '[Director del Proyecto]', role: 'Director de Proyecto' },
        { label: 'Aprobado por:', name: '[Coordinador de Carrera]', role: 'Coordinador de Carrera' },
    ]).map((s, idx) => ({ ...s, _id: (s as any)._id || `sig_${idx}_${s.role}` }));

    const setMode = (newMode: SignaturesMode) => {
        onUpdateConfig(block.id, 'signaturesMode', newMode);
    };

    const updateSignatories = (next: Signatory[]) => {
        onUpdateConfig(block.id, 'signatories', next);
    };

    const updateSignatory = (idx: number, key: keyof Signatory, val: string) => {
        updateSignatories(signatories.map((s, i) => i === idx ? { ...s, [key]: val } : s));
    };

    const addSignatory = () => updateSignatories([...signatories, defaultSignatory()]);
    const removeSignatory = (idx: number) => updateSignatories(signatories.filter((_, i) => i !== idx));

    // Dynamic ordering calculation
    const currentDynamicOrder: string[] = config.signaturesOrder || DYNAMIC_SIGNERS.map(d => d.id);
    const sortedDynamicItems = [...DYNAMIC_SIGNERS].sort((a, b) => {
        const idxA = currentDynamicOrder.indexOf(a.id);
        const idxB = currentDynamicOrder.indexOf(b.id);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    const handleDynamicReorder = (newItems: DynamicSignerItem[]) => {
        const newOrder = newItems.map(item => item.id);
        onUpdateConfig(block.id, 'signaturesOrder', newOrder);
    };

    const handleManualReorder = (newSignatories: any[]) => {
        updateSignatories(newSignatories);
    };

    return (
        <div className="space-y-4 border-t border-border-thin/20 pt-4">
            {/* ── Selector de Modo de Firmas ──────────────────────────────── */}
            <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-text-main uppercase tracking-wider block">
                    Modo de Generación de Firmas
                </label>
                <select
                    value={mode}
                    onChange={e => setMode(e.target.value as SignaturesMode)}
                    className="w-full text-xs bg-surface border border-border-thin rounded-lg p-2 text-text-main focus:outline-none focus:border-border-hover cursor-pointer"
                >
                    <option value="team_dynamic">Automático por Equipo del Proyecto (Dinámico)</option>
                    <option value="institutional_chain">Cadena de Aprobación Institucional</option>
                    <option value="custom_manual">Personalizado / Manual</option>
                </select>
                <span className="text-[8px] text-text-dim block leading-tight">
                    {mode === 'team_dynamic'
                        ? 'Se adapta solo: genera casillas según los docentes y estudiantes reales del proyecto.'
                        : mode === 'institutional_chain'
                        ? 'Genera la cadena de custodia: Director, Coordinador de Carrera y Coordinación DIITRA.'
                        : 'Permite definir firmantes fijos o manuales con nombres y cargos específicos.'}
                </span>
            </div>

            {/* ── Configuración para Modo Dinámico / Institucional ────────── */}
            {mode !== 'custom_manual' && (
                <div className="p-3 bg-surface-hover/30 border border-border-thin rounded-xl space-y-3">
                    <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-text-dim" />
                        Firmantes a Incluir
                    </h5>

                    <Reorder.Group
                        axis="y"
                        values={sortedDynamicItems}
                        onReorder={handleDynamicReorder}
                        className="space-y-2"
                    >
                        {sortedDynamicItems.map((item) => {
                            const isChecked = config[item.configKey] !== undefined
                                ? Boolean(config[item.configKey])
                                : item.defaultChecked;

                            return (
                                <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    initial={{ scale: 1, rotate: 0 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    whileDrag={{
                                        scale: 1.025,
                                        boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.18), 0 10px 15px -5px rgba(0, 0, 0, 0.08)",
                                        cursor: "grabbing",
                                        zIndex: 50
                                    }}
                                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                    className="p-2.5 bg-surface border border-border-thin rounded-lg flex items-center justify-between gap-2 transition-colors cursor-grab active:cursor-grabbing select-none hover:border-border-hover"
                                >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pointer-events-none">
                                        <GripVertical className="w-3.5 h-3.5 text-text-dim/60 shrink-0" />
                                        <div className="min-w-0">
                                            <label className="text-[10px] font-bold text-text-main block truncate">
                                                {item.label}
                                            </label>
                                            <span className="text-[8.5px] text-text-dim block truncate leading-tight">
                                                {item.desc}
                                            </span>
                                        </div>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => onUpdateConfig(block.id, item.configKey, e.target.checked)}
                                        onPointerDown={e => e.stopPropagation()}
                                        className="w-4 h-4 text-text-main accent-text-main bg-surface border-border-thin rounded focus:ring-text-main cursor-pointer ml-1 shrink-0"
                                    />
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                </div>
            )}

            {/* ── Lista Manual de Firmantes (Modo Custom) ────────────────── */}
            {mode === 'custom_manual' && (
                <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-text-dim" />
                        Firmantes Manuales
                    </h5>

                    <Reorder.Group
                        axis="y"
                        values={signatories}
                        onReorder={handleManualReorder}
                        className="space-y-2.5"
                    >
                        {signatories.map((sig, idx) => (
                            <Reorder.Item
                                key={(sig as any)._id || `sig_${idx}`}
                                value={sig}
                                initial={{ scale: 1, rotate: 0 }}
                                animate={{ scale: 1, rotate: 0 }}
                                whileDrag={{
                                    scale: 1.025,
                                    boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.18)",
                                    cursor: "grabbing",
                                    zIndex: 50
                                }}
                                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                className="p-3 border border-border-thin rounded-lg bg-surface space-y-2 relative cursor-grab active:cursor-grabbing hover:border-border-hover"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-text-dim uppercase tracking-wider flex items-center gap-1.5 pointer-events-none">
                                        <GripVertical className="w-3.5 h-3.5 text-text-dim/60" />
                                        Firmante #{idx + 1}
                                    </span>
                                    {signatories.length > 1 && (
                                        <button
                                            type="button"
                                            onPointerDown={e => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSignatory(idx);
                                            }}
                                            className="p-1 rounded hover:bg-error/10 text-text-dim hover:text-error transition-colors cursor-pointer"
                                            title="Eliminar firmante"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1.5" onPointerDown={e => e.stopPropagation()}>
                                    <label className="text-[9px] font-bold text-text-dim uppercase block">Etiqueta</label>
                                    <input
                                        value={sig.label}
                                        onChange={e => updateSignatory(idx, 'label', e.target.value)}
                                        placeholder="Elaborado por:"
                                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none cursor-text"
                                    />
                                </div>

                                <div className="space-y-1.5" onPointerDown={e => e.stopPropagation()}>
                                    <label className="text-[9px] font-bold text-text-dim uppercase block">Nombre / Placeholder</label>
                                    <input
                                        value={sig.name}
                                        onChange={e => updateSignatory(idx, 'name', e.target.value)}
                                        placeholder="[Título, Nombre Completo]"
                                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none cursor-text"
                                    />
                                </div>

                                <div className="space-y-1.5" onPointerDown={e => e.stopPropagation()}>
                                    <label className="text-[9px] font-bold text-text-dim uppercase block">Cargo</label>
                                    <input
                                        value={sig.role}
                                        onChange={e => updateSignatory(idx, 'role', e.target.value)}
                                        placeholder="Coordinador de Carrera"
                                        className="w-full text-xs bg-surface border border-border-thin rounded-md p-2 text-text-main focus:outline-none cursor-text"
                                    />
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <button
                        onClick={addSignatory}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-border-thin text-[10px] font-semibold text-text-dim hover:text-text-main hover:border-border-hover bg-surface hover:bg-surface-hover transition-all cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir Firmante
                    </button>
                </div>
            )}
        </div>
    );
};
