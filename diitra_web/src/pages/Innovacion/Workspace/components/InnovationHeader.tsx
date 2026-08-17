import React from 'react';
import { ArrowLeft, FolderGit2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    asset: {
        uuid: string;
        titulo: string;
        tipo_propiedad_intelectual?: string;
        tipo_producto_nombre?: string;
        estado_senadi?: string;
        trl_actual?: number;
        numero_registro?: string;
        proyecto_titulo?: string;
        proyecto_codigo?: string;
        director_nombre?: string;
        linea_investigacion?: string;
        grupo_investigacion?: string;
    };
}

const getSenadiBadge = (estado?: string) => {
    switch (estado) {
        case 'Concedido':
            return {
                label: 'SENADI CONCEDIDO',
                badgeClass: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
                dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            };
        case 'EnExamen':
            return {
                label: 'EN EXAMEN SENADI',
                badgeClass: 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10',
                dotClass: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
            };
        case 'Solicitado':
            return {
                label: 'TRÁMITE INICIADO',
                badgeClass: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
                dotClass: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
            };
        case 'Denegado':
            return {
                label: 'OBSERVADO SENADI',
                badgeClass: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
                dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
            };
        default:
            return {
                label: 'PROTOTIPO TRL',
                badgeClass: 'border-border-thin text-text-dim bg-surface-hover/60',
                dotClass: 'bg-zinc-400'
            };
    }
};

export const InnovationHeader: React.FC<Props> = ({ asset }) => {
    const senadi = getSenadiBadge(asset.estado_senadi);

    return (
        <div className="space-y-4 mb-8">
            {/* Botón Volver */}
            <div>
                <Link
                    to="/innovacion"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-text-main transition-colors mb-2"
                >
                    <ArrowLeft size={13} />
                    <span>Volver al Catálogo de Innovación</span>
                </Link>
            </div>

            {/* Badge superior con dot */}
            <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${senadi.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${senadi.dotClass}`} />
                    <span>{senadi.label}</span>
                    <span className="opacity-60 font-normal lowercase tracking-normal">
                        · TRL {asset.trl_actual ?? 1}/9
                    </span>
                </div>

                {asset.numero_registro && (
                    <span className="text-[11px] font-mono text-text-dim px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-border-thin">
                        N° {asset.numero_registro}
                    </span>
                )}
            </div>

            {/* Título Principal */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-main">
                    {asset.titulo}
                </h1>
                
                {/* Grupo o Proyecto de Investigación */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-text-dim">
                    {asset.grupo_investigacion && (
                        <span className="font-semibold text-text-main">
                            Grupo: {asset.grupo_investigacion}
                        </span>
                    )}

                    {asset.proyecto_titulo && (
                        <span className="flex items-center gap-1">
                            <FolderGit2 size={12} className="opacity-60" />
                            <span>Proyecto: {asset.proyecto_titulo}</span>
                        </span>
                    )}

                    {asset.director_nombre && (
                        <span className="flex items-center gap-1">
                            <User size={12} className="opacity-60" />
                            <span>Director: {asset.director_nombre}</span>
                        </span>
                    )}
                </div>

                <p className="text-xs text-text-dim mt-2">
                    Gestión del ciclo de maduración tecnológica TRL 1-9, ventanilla de propiedad intelectual SENADI y convenios CTT.
                </p>
            </div>
        </div>
    );
};
