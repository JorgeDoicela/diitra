import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/Common/PageHeader';
import {
    Shield,
    ShieldCheck,
    Search,
    Calendar,
    Filter,
    ChevronLeft,
    ChevronRight,
    Activity,
    MapPin,
    Monitor,
    Download
} from 'lucide-react';
import { useAuditLogs } from './Audit/useAuditLogs';
import { AuditDetailDrawer } from './Audit/AuditDetailDrawer';
import { formatDateSafe, formatActionLabel, getActionBadge } from './Audit/auditTypes';

const AuditPage: React.FC = () => {
    const {
        logs,
        loading,
        page,
        setPage,
        totalPages,
        totalCount,
        search,
        setSearch,
        modulo,
        setModulo,
        action,
        setAction,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        selectedLog,
        setSelectedLog,
        isDrawerOpen,
        setIsDrawerOpen,
        snapshotView,
        setSnapshotView,
        fetchLogs,
        handleExport,
    } = useAuditLogs();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (page === 1) {
            fetchLogs();
        } else {
            setPage(1);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
                <PageHeader
                    kicker="Seguridad Institucional"
                    icon={Shield}
                    title="Registro de auditoría"
                    description="Registro completo de acciones administrativas y académicas para el cumplimiento de normativas SENESCYT/CACES."
                >
                    <div className="flex items-center gap-3">
                        <Link
                            to="/lopdp"
                            className="btn-vercel-secondary flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ShieldCheck size={14} className="text-brand" />
                            Panel LOPDP
                        </Link>
                        <button
                            onClick={handleExport}
                            disabled={logs.length === 0}
                            className="btn-vercel-secondary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Download size={14} />
                            Exportar Reporte
                        </button>
                    </div>
                </PageHeader>

                <div className="bento-card static p-6 mb-8 animate-fade-up [animation-delay:100ms]">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por usuario o acción..."
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <select
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={modulo}
                                onChange={(e) => setModulo(e.target.value)}
                            >
                                <option value="">Todos los Módulos</option>
                                <option value="SEGURIDAD">Seguridad</option>
                                <option value="USUARIOS">Usuarios</option>
                                <option value="PROYECTOS">Proyectos</option>
                                <option value="INVESTIGACION">Grupos de Investigación</option>
                                <option value="CONVOCATORIAS">Convocatorias</option>
                            </select>
                        </div>

                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <select
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            >
                                <option value="">Todas las Acciones</option>
                                <option value="ASIGNAR_ROL">Asignar Rol</option>
                                <option value="REVOCAR_ROL">Revocar Rol</option>
                                <option value="REGISTRO_EXTERNO">Registro Externo</option>
                                <option value="ACTUALIZAR_METADATA">Actualizar datos del documento</option>
                                <option value="LOGIN">Inicio de Sesión</option>
                                <option value="CREAR_GRUPO">Crear Grupo</option>
                                <option value="EDITAR_GRUPO">Editar Grupo</option>
                                <option value="APROBAR_GRUPO">Aprobar Grupo</option>
                                <option value="RECHAZAR_GRUPO">Rechazar Grupo</option>
                                <option value="DESACTIVAR_GRUPO">Desactivar Grupo</option>
                                <option value="AGREGAR_MIEMBRO_GRUPO">Agregar Miembro</option>
                                <option value="REMOVER_MIEMBRO_GRUPO">Remover Miembro</option>
                                <option value="CREAR_PROYECTO">Crear Proyecto</option>
                                <option value="ACTUALIZAR_PROYECTO">Actualizar Proyecto</option>
                                <option value="ELIMINAR_PROYECTO">Eliminar Proyecto</option>
                                <option value="TRANSICIONAR_PROYECTO">Transicionar Proyecto</option>
                                <option value="ASIGNAR_REVISOR">Asignar Revisor</option>
                                <option value="EVALUAR_PROYECTO">Evaluar Proyecto</option>
                                <option value="ACTUALIZAR_EQUIPO_PROYECTO">Actualizar Equipo</option>
                                <option value="TRANSFERIR_DIRECCION">Transferir Dirección</option>
                                <option value="CREAR_CONVOCATORIA">Crear Convocatoria</option>
                                <option value="EDITAR_CONVOCATORIA">Editar Convocatoria</option>
                                <option value="CAMBIAR_ESTADO_CONVOCATORIA">Cambiar Estado Convocatoria</option>
                                <option value="ELIMINAR_CONVOCATORIA">Eliminar Convocatoria</option>
                            </select>
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <input
                                type="date"
                                className="input-vercel !pl-10 !py-2.5 !text-sm text-text-dim focus:text-text-main"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <input
                                type="date"
                                className="input-vercel !pl-10 !py-2.5 !text-sm text-text-dim focus:text-text-main"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-vercel-primary !py-2.5 !text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Filter size={14} />
                            Aplicar Filtros
                        </button>
                    </form>
                </div>

                <div className="bento-card static p-0 overflow-hidden mb-8 animate-fade-up [animation-delay:200ms]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-thin bg-bg-deep/50 text-[11px] font-mono text-text-dim tracking-wider uppercase">
                                    <th className="py-3.5 px-6">Fecha / Hora</th>
                                    <th className="py-3.5 px-6">Usuario / Rol</th>
                                    <th className="py-3.5 px-6">Acción</th>
                                    <th className="py-3.5 px-6">Módulo / Objeto</th>
                                    <th className="py-3.5 px-6">Origen / Red</th>
                                    <th className="py-3.5 px-6 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-thin text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-text-dim font-mono">
                                            Cargando registros de auditoría...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-text-dim font-mono">
                                            No se encontraron eventos registrados con los criterios seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr
                                            key={log.id_audit}
                                            className="hover:bg-bg-deep/40 transition-colors group cursor-pointer"
                                            onClick={() => {
                                                setSelectedLog(log);
                                                setIsDrawerOpen(true);
                                            }}
                                        >
                                            <td className="py-4 px-6 font-mono text-text-dim whitespace-nowrap">
                                                {formatDateSafe(log.date, "dd/MM/yyyy HH:mm:ss")}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-text-main group-hover:text-brand transition-colors">
                                                    {log.admin_name || 'Sistema / Automático'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`badge-vercel ${getActionBadge(log.action)} font-mono uppercase text-[10px]`}>
                                                    {formatActionLabel(log.action)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-text-main">{log.modulo || 'GENERAL'}</div>
                                                <div className="text-[11px] text-text-dim font-mono truncate max-w-xs">{log.target_name || 'Global'}</div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-[11px] text-text-dim">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-text-dim/60" />
                                                    <span>{log.ip_address || '127.0.0.1'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-text-dim/60 truncate max-w-[150px]">
                                                    <Monitor size={10} />
                                                    <span className="truncate">{log.user_agent || 'Navegador Web'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono">
                                                <span className="text-brand hover:underline font-medium text-xs">
                                                    Ver Detalle &rarr;
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="p-4 border-t border-border-thin bg-bg-deep/30 flex items-center justify-between text-xs font-mono text-text-dim">
                        <div>
                            Mostrando página <span className="text-text-main font-bold">{page}</span> de <span className="text-text-main font-bold">{totalPages || 1}</span> ({totalCount} registros totales)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="btn-vercel-secondary !py-1.5 !px-3 disabled:opacity-40 cursor-pointer"
                            >
                                <ChevronLeft size={14} /> Anterior
                            </button>
                            <button
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                                className="btn-vercel-secondary !py-1.5 !px-3 disabled:opacity-40 cursor-pointer"
                            >
                                Siguiente <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AuditDetailDrawer
                log={selectedLog}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                snapshotView={snapshotView}
                setSnapshotView={setSnapshotView}
            />
        </main>
    );
};

export default AuditPage;
