import React from 'react';
import { Users, Edit2, Trash2, CheckCircle, XCircle, Calendar, Loader2, Eye } from 'lucide-react';
import type { Group } from './types';

interface GroupsTableProps {
    groups: Group[];
    loading: boolean;
    viewMode: 'all' | 'my';
    isAdmin: boolean;
    user: any;
    detailGroup: Group | null;
    lastActiveGroupId: string | null;
    onSelectDetail: (g: Group, isEditing?: boolean) => void;
    onDelete: (uuid: string, name: string) => void;
    formatNombre: (nombre: string | null | undefined) => string;
    formatCareerName: (name: string) => string;
}

export const GroupsTable: React.FC<GroupsTableProps> = ({
    groups,
    loading,
    viewMode,
    isAdmin,
    user,
    detailGroup,
    lastActiveGroupId,
    onSelectDetail,
    onDelete,
    formatNombre,
    formatCareerName,
}) => {
    const filteredGroups = groups.filter(g => {
        if (isAdmin || viewMode === 'all') return true;
        const isCoord = g.id_profesor_coordinador?.trim() === user?.id_referencia?.trim();
        const isMem = g.teacherMemberCedulas?.some((ced: string) => ced.trim() === user?.id_referencia?.trim());
        return isCoord || isMem;
    });

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="bento-card static overflow-hidden animate-fade-up">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                <th className="p-4 font-bold tracking-widest">Grupo</th>
                                <th className="p-4 font-bold tracking-widest">Coordinador</th>
                                <th className="p-4 font-bold tracking-widest">Vinculación</th>
                                <th className="p-4 font-bold tracking-widest">Estado</th>
                                <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 py-4">
                                            <Loader2 className="animate-spin text-text-main h-6 w-6" />
                                            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Cargando grupos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state py-20 text-center space-y-3">
                                            <Users size={32} className="mx-auto text-text-dim/30" />
                                            <p className="text-text-dim font-bold uppercase tracking-widest text-xs">
                                                {viewMode === 'my' ? 'No participas en ningún grupo de investigación' : 'No se encontraron grupos registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map((g) => {
                                    const canEditOrDelete = isAdmin || ((g.id_profesor_coordinador?.trim() === user?.id_referencia?.trim() || g.teacherMemberCedulas?.some((ced: string) => ced.trim() === user?.id_referencia?.trim())) && g.estado !== 'Aprobado');

                                    return (
                                        <tr
                                            key={g.id_grupo}
                                            onClick={() => onSelectDetail(g, false)}
                                            className={`transition-all duration-300 group cursor-pointer ${
                                                detailGroup?.uuid === g.uuid
                                                    ? 'bg-brand/[0.08]'
                                                    : (!detailGroup && lastActiveGroupId === g.uuid)
                                                        ? 'row-last-active'
                                                        : 'hover:bg-surface/30'
                                            }`}
                                        >
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-semibold text-text-main tracking-tight group-hover:text-brand transition-colors">
                                                        {g.nombre}
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <span className="text-[9px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                            {g.siglas || 'SIN SIGLAS'}
                                                        </span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim/80">
                                                            {g.tipo_grupo}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-semibold text-text-main">{g.nombre_coordinador ? formatNombre(g.nombre_coordinador) : 'No asignado'}</p>
                                                {g.carrera_coordinador && (
                                                    <p className="text-[9px] text-text-dim uppercase font-semibold mt-0.5">{formatCareerName(g.carrera_coordinador)}</p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-text-dim font-mono uppercase">
                                                        {g.lineas_ids?.length || 0} Líneas de Inv.
                                                    </p>
                                                    <p className="text-[10px] text-text-dim font-mono uppercase">
                                                        {g.carreras_ids?.length || 0} Carreras Vinculadas
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {g.estado === 'Aprobado' && (
                                                        <span className="badge-vercel badge-vercel-success">
                                                            <CheckCircle size={10} /> Aprobado
                                                        </span>
                                                    )}
                                                    {g.estado === 'Pendiente' && (
                                                        <span className="badge-vercel badge-vercel-warning">
                                                            <Calendar size={10} /> Pendiente
                                                        </span>
                                                    )}
                                                    {g.estado === 'En Evaluación' && (
                                                        <span className="badge-vercel badge-vercel-info">
                                                            <Loader2 size={10} className="animate-spin" /> En Evaluación
                                                        </span>
                                                    )}
                                                    {g.estado === 'Rechazado' && (
                                                        <span className="badge-vercel badge-vercel-error">
                                                            <XCircle size={10} /> Rechazado
                                                        </span>
                                                    )}
                                                    <p className={`text-[8px] font-mono tracking-wider uppercase ${g.activo ? 'text-success' : 'text-text-dim/60'}`}>
                                                        ● {g.activo ? 'Vigente' : 'Inactivo'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => onSelectDetail(g, false)}
                                                        className="p-1.5 rounded hover:bg-brand/10 text-text-dim group-hover:text-brand transition-all"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {canEditOrDelete && (
                                                        <button
                                                            onClick={() => onSelectDetail(g, true)}
                                                            className="p-1.5 rounded hover:bg-surface text-text-dim hover:text-text-main transition-all action-btn-exclude"
                                                            title="Editar Grupo"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {canEditOrDelete && (
                                                        <button
                                                            onClick={() => onDelete(g.uuid, g.nombre)}
                                                            className="p-1.5 rounded hover:bg-red-500/10 text-text-dim hover:bg-red-500/10 transition-all action-btn-exclude"
                                                            title={isAdmin ? "Desactivar" : "Eliminar"}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
