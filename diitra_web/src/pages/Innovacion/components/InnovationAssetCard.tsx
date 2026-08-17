import React from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheck, 
    FolderGit2,
    ArrowRight,
    Calendar,
    Zap
} from 'lucide-react';
import type { InnovationAsset } from '../types';

interface Props {
    asset: InnovationAsset;
    onViewDetail?: (asset: InnovationAsset) => void;
}

const getTrlInfo = (trl?: number) => {
    const level = trl ?? 1;
    if (level <= 3) return { label: `TRL ${level}/9`, text: 'Concepto', color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20', dot: 'bg-zinc-500' };
    if (level <= 6) return { label: `TRL ${level}/9`, text: 'Prototipo', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' };
    return { label: `TRL ${level}/9`, text: 'Operativo', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' };
};

const getSenadiBadge = (estado?: string) => {
    switch (estado) {
        case 'Concedido':
            return {
                label: 'SENADI CONCEDIDO',
                badgeClass: 'status-label border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
                dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            };
        case 'EnExamen':
            return {
                label: 'EN EXAMEN SENADI',
                badgeClass: 'status-label border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10',
                dotClass: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
            };
        case 'Solicitado':
            return {
                label: 'TRÁMITE INICIADO',
                badgeClass: 'status-label border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
                dotClass: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            };
        case 'Denegado':
            return {
                label: 'OBSERVADO SENADI',
                badgeClass: 'status-label border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
                dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
            };
        default:
            return {
                label: 'PROTOTIPO TRL',
                badgeClass: 'status-label border-border-thin text-text-dim bg-surface-hover/60',
                dotClass: 'bg-zinc-400'
            };
    }
};

export const InnovationAssetCard: React.FC<Props> = ({ asset, onViewDetail }) => {
    const trl = getTrlInfo(asset.trl_actual);
    const senadi = getSenadiBadge(asset.estado_senadi);

    const assetCode = asset.numero_registro 
        ? asset.numero_registro 
        : `ACT-${asset.tipo_propiedad_intelectual?.substring(0, 4).toUpperCase() || 'PROT'}-${asset.id_producto.toString().padStart(3, '0')}`;

    return (
        <div 
            onClick={() => onViewDetail && onViewDetail(asset)}
            className="bento-card group relative p-6 overflow-hidden flex flex-col justify-between hover:border-brand/40 transition-all duration-200 cursor-pointer"
        >
            <Link
                to={`/innovacion/workspace/${asset.uuid}`}
                className="absolute inset-0 z-10"
                aria-label={`Ver expediente de ${asset.titulo}`}
            />
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-subtle rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
                {/* Header: Código institucional & Flecha */}
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-text-dim uppercase tracking-[0.2em] mb-1 font-mono">
                            {assetCode}
                        </p>
                        <h3 className="font-semibold text-text-main text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                            {asset.titulo}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2 mt-0.5 relative z-20">
                        <ArrowRight
                            size={14}
                            className="text-text-dim group-hover:text-brand group-hover:translate-x-1 transition-all"
                        />
                    </div>
                </div>

                {/* Badge de Estado con punto de pulso */}
                <div className={`${senadi.badgeClass} self-start text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full border`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${senadi.dotClass}`} />
                    <span>{senadi.label}</span>
                    <span className="opacity-60 font-normal lowercase tracking-normal">
                        · {asset.tipo_propiedad_intelectual || asset.tipo_producto_nombre || 'Tecnológico'}
                    </span>
                </div>

                {/* Proyecto de Investigación de Origen */}
                {asset.proyecto_titulo && (
                    <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                        <FolderGit2 size={11} className="shrink-0 opacity-70" />
                        <span className="truncate">{asset.proyecto_titulo}</span>
                    </div>
                )}

                {/* Grid de 3 Métricas en Píldoras */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                        <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">
                            {asset.trl_actual ?? 1}/9
                        </p>
                        <p className="text-[9px] text-text-dim uppercase tracking-wide">Madurez TRL</p>
                    </div>
                    <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                        <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">
                            {asset.total_transferencias ?? 0}
                        </p>
                        <p className="text-[9px] text-text-dim uppercase tracking-wide">Convenios CTT</p>
                    </div>
                    <div className="text-center p-2 bg-bg-deep rounded-lg border border-border-thin">
                        <p className="stat-number--sm !text-sm font-bold text-text-main font-mono">
                            {asset.cantidad ?? 1}
                        </p>
                        <p className="text-[9px] text-text-dim uppercase tracking-wide">Entregables</p>
                    </div>
                </div>
            </div>

            {/* Footer con Fecha, TRL y SENADI */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-4 text-[10px] text-text-dim">
                <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>
                        {asset.fecha_registro_senadi 
                            ? new Date(asset.fecha_registro_senadi).toLocaleDateString('es-EC')
                            : 'Registrado'}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Zap size={10} className="text-warning" />
                    <span className="font-semibold text-text-main">TRL {asset.trl_actual ?? 1} ({trl.text})</span>
                </div>

                {asset.numero_registro && (
                    <div className="flex items-center gap-1 text-sky-500 font-mono">
                        <ShieldCheck size={10} />
                        <span>{asset.numero_registro}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
