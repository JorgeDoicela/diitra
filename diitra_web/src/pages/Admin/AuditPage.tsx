import React, { useState, useEffect } from 'react';
import api from '../../api/axios_config';
import { 
    Shield, 
    Search, 
    Calendar, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Activity, 
    MapPin, 
    Monitor, 
    Code,
    Info,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface AuditLog {
    id_audit: number;
    admin_name: string;
    target_name: string;
    action: string;
    modulo: string;
    details: string;
    ip_address: string;
    user_agent: string;
    values_before: string;
    values_after: string;
    date: string;
}

interface PagedResult {
    items: AuditLog[];
    total_count: number;
    page_number: number;
    page_size: number;
    total_pages: number;
}

const getActionBadge = (action: string): string => {
    const a = action.toUpperCase();
    if (a.includes('REVOKE') || a.includes('REVOCAR') || a.includes('DELETE') || a.includes('REMOVE')) return 'badge-vercel-error';
    if (a.includes('ASIGN') || a.includes('REGISTER') || a.includes('CREATE') || a.includes('ADD')) return 'badge-vercel-success';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY')) return 'badge-vercel-warning';
    return 'badge-vercel-info';
};

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    
    const [search, setSearch] = useState('');
    const [modulo, setModulo] = useState('');
    const [action, setAction] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, _setToDate] = useState('');

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '15',
                search: search,
                modulo: modulo,
                action: action,
                from: fromDate,
                to: toDate
            });
            const response = await api.get<PagedResult>(`/Admin/audit/advanced?${params}`);
            setLogs(response.data.items);
            setTotalPages(response.data.total_pages);
            setTotalCount(response.data.total_count);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, modulo, action, fromDate, toDate]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (page === 1) {
            fetchLogs();
        } else {
            setPage(1);
        }
    };

    const renderJson = (jsonStr: string | null) => {
        if (!jsonStr) return <span className="text-text-dim italic">Sin datos de estado</span>;
        try {
            const obj = JSON.parse(jsonStr);
            return (
                <pre className="text-[10px] font-mono bg-bg-deep p-3 rounded border border-border-thin overflow-x-auto text-text-dim leading-relaxed">
                    {JSON.stringify(obj, null, 2)}
                </pre>
            );
        } catch {
            return <span className="text-[10px] font-mono text-text-dim">{jsonStr}</span>;
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 px-2 animate-fade-up">
                    <div className="space-y-2">
                        <div className="section-label text-text-main">
                            <Shield size={10} strokeWidth={2} />
                            <span>Seguridad Institucional</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                            Auditoría Forense
                        </h2>
                        <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                            Trazabilidad total de acciones administrativas y académicas para el cumplimiento de normativas SENESCYT/CACES.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="btn-vercel-secondary flex items-center justify-center gap-2">
                            <Download size={14} />
                            Exportar Reporte
                        </button>
                    </div>
                </header>

                <div className="bento-card static p-6 mb-8 animate-fade-up [animation-delay:100ms]">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                <option value="LOGIN">Inicio de Sesión</option>
                            </select>
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <input 
                                type="date" 
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn-vercel-primary">
                            Filtrar Logs
                        </button>
                    </form>
                </div>

                <div className="bento-card static overflow-hidden animate-fade-up [animation-delay:200ms]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-surface/50 border-b border-border-thin">
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Fecha y Hora</th>
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Administrador</th>
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Acción</th>
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Módulo</th>
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase">Afectado / Detalle</th>
                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-thin">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="p-4"><div className="h-4 bg-surface rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty-state py-20">
                                                <div className="icon-circle icon-circle-info mx-auto mb-4">
                                                    <Info size={24} />
                                                </div>
                                                <p className="text-text-dim font-bold uppercase tracking-widest">No se encontraron registros</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr 
                                            key={log.id_audit} 
                                            className="group hover:bg-surface/30 transition-all cursor-pointer"
                                            onClick={() => {
                                                setSelectedLog(log);
                                                setIsDrawerOpen(true);
                                            }}
                                        >
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="text-[11px] font-mono text-text-main">
                                                    {format(new Date(log.date), "dd MMM, HH:mm:ss", { locale: es })}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-surface border border-border-thin flex items-center justify-center text-[10px] font-bold text-text-dim uppercase shrink-0">
                                                        {log.admin_name?.charAt(0) || 'A'}
                                                    </div>
                                                    <span className="text-xs font-bold text-text-main">{log.admin_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`status-tag ${getActionBadge(log.action)}`}>
                                                    {log.action?.replace('_', ' ') || 'S/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className="section-label text-text-dim !text-[9px] !gap-1.5">
                                                    {log.modulo || 'SISTEMA'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-text-main">{log.target_name || 'Global'}</span>
                                                    <span className="text-[10px] text-text-dim truncate max-w-[250px]">{log.details}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-2 rounded border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all">
                                                    <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-surface/30 border-t border-border-thin flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                            Mostrando {logs.length} de {totalCount} registros históricos
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                                className="btn-vercel-secondary !p-2 disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold text-text-main px-4">
                                Página {page} de {totalPages}
                            </span>
                            <button 
                                disabled={page === totalPages}
                                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                                className="btn-vercel-secondary !p-2 disabled:opacity-30"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {isDrawerOpen && selectedLog && (
                    <div className="fixed inset-0 z-[9999] flex justify-end">
                        <div 
                            className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                            onClick={() => setIsDrawerOpen(false)}
                        />
                        <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                            <div className="modal-header">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">Inspección Forense</h3>
                                    <p className="section-label text-text-dim">Hash de Integridad Verificado</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">
                                            <Calendar size={12} /> Fecha y Registro
                                        </label>
                                        <div className="text-sm font-bold text-text-main">
                                            {format(new Date(selectedLog.date), "dd/MM/yyyy")}
                                        </div>
                                        <div className="text-xs text-text-dim mt-1 font-mono">
                                            {format(new Date(selectedLog.date), "HH:mm:ss.SSS")}
                                        </div>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">
                                            <Activity size={12} /> Acción
                                        </label>
                                        <span className={`status-tag ${getActionBadge(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </span>
                                        <div className="text-xs text-text-dim mt-2 uppercase tracking-widest opacity-50">
                                            {selectedLog.modulo || 'GLOBAL'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="section-label text-text-dim">
                                        <MapPin size={12} /> Metadata de Origen
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bento-card static p-4 flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-dim uppercase tracking-tighter">Dirección IP de Red</span>
                                            <span className="text-xs font-mono text-text-main bg-bg-deep px-3 py-1 rounded border border-border-thin">{selectedLog.ip_address || '127.0.0.1'}</span>
                                        </div>
                                        <div className="bento-card static p-4">
                                            <div className="section-label text-text-dim mb-3">
                                                <Monitor size={12} /> User Agent (Browser Metadata)
                                            </div>
                                            <p className="text-[10px] font-mono text-text-dim leading-relaxed bg-bg-deep p-3 rounded border border-border-thin italic">
                                                {selectedLog.user_agent || 'Client Information Not Captured'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="section-label text-text-dim">
                                        <Code size={12} /> Trazabilidad de Estado (Snapshots)
                                    </label>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-error uppercase mb-3 ml-1">
                                                <span className="dot dot-error" />
                                                Estado Anterior (Original)
                                            </div>
                                            {renderJson(selectedLog.values_before)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-success uppercase mb-3 ml-1">
                                                <span className="dot dot-success" />
                                                Estado Nuevo (Modificado)
                                            </div>
                                            {renderJson(selectedLog.values_after)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer justify-center">
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-[9px] font-mono text-text-dim uppercase">
                                        ID Autogenerado: {selectedLog.id_audit}
                                    </p>
                                    <p className="text-[8px] font-mono text-text-dim opacity-50 uppercase">
                                        Firmado digitalmente por el Motor de Auditoría DIITRA
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default AuditPage;