import React, { useState } from 'react';
import { Shield, Info, Plus, Minus, ArrowDown, Copy, Check } from 'lucide-react';
import { formatDateSafe, formatKeyName } from './auditTypes';
import type { AuditLog } from './auditTypes';

interface CopyButtonProps {
    text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded border border-border-thin bg-surface text-text-dim hover:text-text-main hover:border-border-hover transition-all text-[9px] font-semibold flex items-center gap-1 cursor-pointer z-20"
        >
            {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
            {copied ? '¡Copiado!' : 'Copiar'}
        </button>
    );
};

const renderValue = (value: unknown) => {
    if (value === null || value === undefined) {
        return <span className="text-text-dim/40 italic">ninguno</span>;
    }

    if (typeof value === 'boolean') {
        return value ? (
            <span className="badge-vercel badge-vercel-success py-0 px-2 text-[9px] font-semibold">
                SÍ
            </span>
        ) : (
            <span className="badge-vercel badge-vercel-error py-0 px-2 text-[9px] font-semibold">
                NO
            </span>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-text-dim/40 italic">vacío</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {value.map((item, idx) => (
                    <span key={idx} className="badge-vercel badge-vercel-neutral py-0 px-1.5 text-[9px] font-mono">
                        {String(item)}
                    </span>
                ))}
            </div>
        );
    }

    if (typeof value === 'object') {
        try {
            return (
                <pre className="text-[9px] font-mono bg-bg-deep p-1.5 rounded max-w-xs overflow-x-auto whitespace-pre">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        } catch {
            return <span className="font-mono text-text-dim text-[10px]">[Objeto]</span>;
        }
    }

    const str = String(value);
    if (str.length > 150) {
        return (
            <details className="cursor-pointer max-w-xs text-[10px]">
                <summary className="text-[10px] text-brand hover:underline font-medium">Ver texto largo ({str.length} carac.)</summary>
                <div className="mt-1 font-mono p-2 bg-bg-deep/50 rounded border border-border-thin whitespace-pre-wrap leading-relaxed">
                    {str}
                </div>
            </details>
        );
    }

    return <span className="font-mono text-text-main leading-normal">{str}</span>;
};

interface AuditDetailDrawerProps {
    log: AuditLog | null;
    isOpen: boolean;
    onClose: () => void;
    snapshotView: 'diff' | 'before' | 'after';
    setSnapshotView: (view: 'diff' | 'before' | 'after') => void;
}

export const AuditDetailDrawer: React.FC<AuditDetailDrawerProps> = ({
    log,
    isOpen,
    onClose,
    snapshotView,
    setSnapshotView,
}) => {
    if (!isOpen || !log) return null;

    const getActionType = (action: string): 'create' | 'update' | 'delete' | 'other' => {
        const a = action.toUpperCase();
        if (a.includes('CREAR') || a.includes('CREATE') || a.includes('ASIGN') || a.includes('REGISTER') || a.includes('AGREGAR')) return 'create';
        if (a.includes('ELIMINAR') || a.includes('DELETE') || a.includes('REMOVE') || a.includes('DESACTIVAR')) return 'delete';
        if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY') || a.includes('ACTUALIZAR') || a.includes('APROBAR') || a.includes('RECHAZAR') || a.includes('REVOCAR') || a.includes('REVOKE') || a.includes('CAMBIAR') || a.includes('TRANSICIONAR') || a.includes('EVALUAR') || a.includes('TRANSFERIR')) return 'update';
        return 'other';
    };

    const parseJson = (jsonStr: string | null): Record<string, unknown> | null => {
        if (!jsonStr) return null;
        try {
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    };

    const computeDiff = (before: Record<string, unknown> | null, after: Record<string, unknown> | null) => {
        const allKeys = new Set<string>();
        if (before) Object.keys(before).forEach(k => allKeys.add(k));
        if (after) Object.keys(after).forEach(k => allKeys.add(k));

        const entries: Array<{ key: string; before: unknown; after: unknown; status: 'added' | 'removed' | 'changed' | 'unchanged' }> = [];

        allKeys.forEach(key => {
            const bVal = before?.[key];
            const aVal = after?.[key];
            const bStr = JSON.stringify(bVal);
            const aStr = JSON.stringify(aVal);

            if (!(key in (before || {}))) {
                entries.push({ key, before: undefined, after: aVal, status: 'added' });
            } else if (!(key in (after || {}))) {
                entries.push({ key, before: bVal, after: undefined, status: 'removed' });
            } else if (bStr !== aStr) {
                entries.push({ key, before: bVal, after: aVal, status: 'changed' });
            } else {
                entries.push({ key, before: bVal, after: aVal, status: 'unchanged' });
            }
        });

        return entries;
    };

    const actionType = getActionType(log.action);
    const before = parseJson(log.values_before);
    const after = parseJson(log.values_after);
    const hasBefore = before !== null;
    const hasAfter = after !== null;
    const isLogin = log.action?.toUpperCase() === 'LOGIN';
    const isOtherAction = !hasBefore && !hasAfter;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
            <div className="w-full max-w-2xl bg-surface border-l border-border-thin h-full flex flex-col shadow-2xl animate-slide-left">
                <div className="p-6 border-b border-border-thin flex items-center justify-between bg-bg-deep/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-brand/10 border border-brand/20 text-brand">
                            <Shield size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-text-main">Detalle del Registro de Auditoría</h3>
                            <p className="text-xs text-text-dim">ID Registro: #{log.id_audit}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-vercel-secondary !p-2 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-bg-deep/30 p-4 rounded border border-border-thin text-xs">
                        <div>
                            <span className="text-text-dim uppercase text-[9px] font-mono">Administrador</span>
                            <p className="font-semibold text-text-main mt-0.5">{log.admin_name || '—'}</p>
                        </div>
                        <div>
                            <span className="text-text-dim uppercase text-[9px] font-mono">Fecha y Hora</span>
                            <p className="font-semibold text-text-main mt-0.5">{formatDateSafe(log.date, "dd/MM/yyyy HH:mm:ss")}</p>
                        </div>
                        <div>
                            <span className="text-text-dim uppercase text-[9px] font-mono">Módulo</span>
                            <p className="font-semibold text-text-main mt-0.5">{log.modulo || 'SISTEMA'}</p>
                        </div>
                        <div>
                            <span className="text-text-dim uppercase text-[9px] font-mono">Afectado</span>
                            <p className="font-semibold text-text-main mt-0.5">{log.target_name || 'Global'}</p>
                        </div>
                    </div>

                    {/* Selector de vistas */}
                    {(hasBefore || hasAfter) && (
                        <div className="flex items-center gap-2 border-b border-border-thin pb-3">
                            <button
                                onClick={() => setSnapshotView('diff')}
                                className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-all ${snapshotView === 'diff' ? 'bg-brand text-white font-semibold' : 'text-text-dim hover:text-text-main'}`}
                            >
                                Diferencias (Diff)
                            </button>
                            {hasBefore && (
                                <button
                                    onClick={() => setSnapshotView('before')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-all ${snapshotView === 'before' ? 'bg-brand text-white font-semibold' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Estado Anterior
                                </button>
                            )}
                            {hasAfter && (
                                <button
                                    onClick={() => setSnapshotView('after')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-all ${snapshotView === 'after' ? 'bg-brand text-white font-semibold' : 'text-text-dim hover:text-text-main'}`}
                                >
                                    Estado Nuevo
                                </button>
                            )}
                        </div>
                    )}

                    {/* Contenido del snapshot */}
                    {isLogin || isOtherAction ? (
                        <div className="bento-card static p-6 text-center">
                            <div className="icon-circle icon-circle-info mx-auto mb-3 w-10 h-10">
                                <Info size={18} />
                            </div>
                            <p className="text-xs text-text-dim font-medium">
                                {isLogin ? 'Evento de autenticación sin cambios de estado' : 'Esta acción no registra cambios de estado'}
                            </p>
                        </div>
                    ) : snapshotView === 'before' && hasBefore ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-[9px] font-semibold text-error uppercase ml-1">
                                <span className="dot dot-error" />
                                Estado Anterior
                            </div>
                            <div className="relative">
                                <pre className="text-[10px] font-mono bg-bg-deep p-4 rounded border border-border-thin overflow-x-auto text-text-dim leading-relaxed whitespace-pre-wrap max-h-96">
                                    {JSON.stringify(before, null, 2)}
                                </pre>
                                <CopyButton text={JSON.stringify(before, null, 2)} />
                            </div>
                        </div>
                    ) : snapshotView === 'after' && hasAfter ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-[9px] font-semibold text-success uppercase ml-1">
                                <span className="dot dot-success" />
                                Estado Nuevo
                            </div>
                            <div className="relative">
                                <pre className="text-[10px] font-mono bg-bg-deep p-4 rounded border border-border-thin overflow-x-auto text-text-dim leading-relaxed whitespace-pre-wrap max-h-96">
                                    {JSON.stringify(after, null, 2)}
                                </pre>
                                <CopyButton text={JSON.stringify(after, null, 2)} />
                            </div>
                        </div>
                    ) : actionType === 'create' && !hasBefore && hasAfter ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-[9px] font-semibold text-success uppercase ml-1">
                                <Plus size={10} />
                                Registro Creado
                            </div>
                            <div className="rounded border border-border-thin overflow-hidden">
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="bg-bg-deep">
                                            <th className="p-2 text-left font-mono text-text-dim tracking-wider uppercase w-1/3">Campo</th>
                                            <th className="p-2 text-left font-mono text-success tracking-wider uppercase">Valor Registrado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin">
                                        {Object.entries(after || {}).map(([key, val]) => (
                                            <tr key={key} className="hover:bg-bg-deep/50 transition-colors">
                                                <td className="p-2 font-mono font-semibold text-text-main border-r border-border-thin">{formatKeyName(key)}</td>
                                                <td className="p-2 font-mono">{renderValue(val)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : actionType === 'delete' && hasBefore && !hasAfter ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-[9px] font-semibold text-error uppercase ml-1">
                                <Minus size={10} />
                                Registro Eliminado
                            </div>
                            <div className="rounded border border-border-thin overflow-hidden opacity-85">
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr className="bg-bg-deep">
                                            <th className="p-2 text-left font-mono text-text-dim tracking-wider uppercase w-1/3">Campo</th>
                                            <th className="p-2 text-left font-mono text-error tracking-wider uppercase">Valor Anterior</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin">
                                        {Object.entries(before || {}).map(([key, val]) => (
                                            <tr key={key} className="hover:bg-bg-deep/50 transition-colors">
                                                <td className="p-2 font-mono font-semibold text-text-dim border-r border-border-thin line-through">{formatKeyName(key)}</td>
                                                <td className="p-2 font-mono text-text-dim line-through">{renderValue(val)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : hasBefore && hasAfter ? (
                        (() => {
                            const diff = computeDiff(before, after);
                            const changedKeys = diff.filter(d => d.status !== 'unchanged');
                            const unchangedKeys = diff.filter(d => d.status === 'unchanged');

                            return (
                                <div className="space-y-4 animate-fade-in">
                                    {changedKeys.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase ml-1">
                                                <ArrowDown size={10} className="text-text-dim" />
                                                <span className="text-text-main">Campos Modificados</span>
                                                <span className="text-text-dim">({changedKeys.length})</span>
                                            </div>
                                            <div className="rounded border border-border-thin overflow-hidden">
                                                <table className="w-full text-[11px]">
                                                    <thead>
                                                        <tr className="bg-bg-deep">
                                                            <th className="p-2 text-left font-mono text-text-dim tracking-wider uppercase w-1/3">Campo</th>
                                                            <th className="p-2 text-left font-mono text-error tracking-wider uppercase">Antes</th>
                                                            <th className="p-2 text-left font-mono text-success tracking-wider uppercase">Después</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border-thin">
                                                        {changedKeys.map(entry => (
                                                            <tr key={entry.key} className="hover:bg-bg-deep/50 transition-colors">
                                                                <td className="p-2 font-mono font-semibold text-text-main border-r border-border-thin">{formatKeyName(entry.key)}</td>
                                                                <td className={`p-2 font-mono ${entry.status === 'removed' ? 'text-error line-through' : entry.status === 'changed' ? 'text-error' : 'text-text-dim'}`}>
                                                                    {renderValue(entry.before)}
                                                                </td>
                                                                <td className={`p-2 font-mono ${entry.status === 'added' ? 'text-success' : entry.status === 'changed' ? 'text-success' : 'text-text-dim'}`}>
                                                                    {renderValue(entry.after)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bento-card static p-4 text-center">
                                            <p className="text-xs text-text-dim font-medium">No se detectaron diferencias entre los estados anterior y nuevo.</p>
                                        </div>
                                    )}
                                    {unchangedKeys.length > 0 && (
                                        <details className="group">
                                            <summary className="text-[9px] font-semibold text-text-dim uppercase tracking-widest cursor-pointer hover:text-text-main transition-colors ml-1 select-none">
                                                <span className="group-open:rotate-90 inline-block transition-transform">&#x25B6;</span> Campos sin cambios ({unchangedKeys.length})
                                            </summary>
                                            <div className="mt-2 rounded border border-border-thin overflow-hidden bg-bg-deep/30">
                                                <table className="w-full text-[11px]">
                                                    <tbody className="divide-y divide-border-thin">
                                                        {unchangedKeys.map(entry => (
                                                            <tr key={entry.key} className="hover:bg-bg-deep/50 transition-colors">
                                                                <td className="p-2 font-mono font-medium text-text-dim border-r border-border-thin w-1/3">{formatKeyName(entry.key)}</td>
                                                                <td className="p-2 font-mono text-text-dim/80">{renderValue(entry.after)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </details>
                                    )}
                                </div>
                            );
                        })()
                    ) : null}
                </div>
            </div>
        </div>
    );
};
