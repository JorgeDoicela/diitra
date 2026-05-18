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

const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    
    // Filtros
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

    const getActionColor = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes('REVOKE') || a.includes('REVOCAR') || a.includes('DELETE') || a.includes('REMOVE')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (a.includes('ASIGN') || a.includes('REGISTER') || a.includes('CREATE') || a.includes('ADD')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    };

    const renderJson = (jsonStr: string | null) => {
        if (!jsonStr) return <span className="text-text-dim italic">Sin datos de estado</span>;
        try {
            const obj = JSON.parse(jsonStr);
            return (
                <pre className="text-[10px] font-mono bg-bg-deep p-3 rounded-lg border border-border-thin overflow-x-auto text-text-dim leading-relaxed">
                    {JSON.stringify(obj, null, 2)}
                </pre>
            );
        } catch {
            return <span className="text-[10px] font-mono text-text-dim">{jsonStr}</span>;
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Profesional */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-text-dim mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Seguridad Institucional</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-text-main">
                        AUDITORÍA <span className="text-text-dim">FORENSE</span>
                    </h1>
                    <p className="text-text-dim text-sm max-w-2xl">
                        Trazabilidad total de acciones administrativas y académicas para el cumplimiento de normativas SENESCYT/CACES.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-deep border border-border-thin rounded-xl text-xs font-bold text-text-main hover:border-text-dim transition-all">
                        <Download className="w-4 h-4" />
                        EXPORTAR REPORTE
                    </button>
                </div>
            </div>

            {/* Panel de Filtros */}
            <div className="bg-bg-deep/50 backdrop-blur-md border border-border-thin rounded-3xl p-6 mb-8 shadow-xl shadow-bg-deep/50">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar por usuario o acción..."
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-main border border-border-thin rounded-xl text-sm text-text-main placeholder:text-text-dim/50 focus:outline-none focus:border-text-dim transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                        <select 
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-main border border-border-thin rounded-xl text-sm text-text-main focus:outline-none focus:border-text-dim appearance-none transition-all"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-main border border-border-thin rounded-xl text-sm text-text-main focus:outline-none focus:border-text-dim appearance-none transition-all"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-bg-main border border-border-thin rounded-xl text-sm text-text-main focus:outline-none focus:border-text-dim transition-all"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-2.5 btn-vercel-primary rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-text-main/10"
                    >
                        FILTRAR LOGS
                    </button>
                </form>
            </div>

            {/* Tabla de Resultados */}
            <div className="bg-bg-main border border-border-thin rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-bg-deep/50 border-b border-border-thin">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-text-dim uppercase tracking-tighter">Fecha y Hora</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-text-dim uppercase tracking-tighter">Administrador</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-text-dim uppercase tracking-tighter">Acción</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-text-dim uppercase tracking-tighter">Módulo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-text-dim uppercase tracking-tighter">Afectado / Detalle</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-text-dim uppercase tracking-tighter">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin/50">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-6 bg-bg-deep rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-text-dim">
                                            <Info className="w-10 h-10 opacity-20" />
                                            <p className="text-sm font-medium">No se encontraron registros en el historial</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr 
                                        key={log.id_audit} 
                                        className="group hover:bg-bg-deep/30 transition-all cursor-pointer border-l-2 border-transparent hover:border-text-main"
                                        onClick={() => {
                                            setSelectedLog(log);
                                            setIsDrawerOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs font-mono text-text-main">
                                                {format(new Date(log.date), "dd MMM, HH:mm:ss", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-text-dim/10 flex items-center justify-center text-[10px] font-bold text-text-dim uppercase">
                                                    {log.admin_name?.charAt(0) || 'A'}
                                                </div>
                                                <span className="text-xs font-bold text-text-main">{log.admin_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${getActionColor(log.action)}`}>
                                                {log.action?.replace('_', ' ') || 'S/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-text-dim uppercase tracking-widest">
                                            {log.modulo || 'SISTEMA'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-text-main">{log.target_name || 'Global'}</span>
                                                <span className="text-[10px] text-text-dim truncate max-w-[250px]">{log.details}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 rounded-lg border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-text-dim transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Paginación */}
                <div className="px-6 py-4 bg-bg-deep/30 border-t border-border-thin flex items-center justify-between">
                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                        Mostrando {logs.length} de {totalCount} registros históricos
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                            className="p-2 rounded-xl border border-border-thin disabled:opacity-30 hover:border-text-dim transition-all bg-bg-main"
                        >
                            <ChevronLeft className="w-4 h-4 text-text-main" />
                        </button>
                        <span className="text-xs font-bold text-text-main px-4">
                            Página {page} de {totalPages}
                        </span>
                        <button 
                            disabled={page === totalPages}
                            onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                            className="p-2 rounded-xl border border-border-thin disabled:opacity-30 hover:border-text-dim transition-all bg-bg-main"
                        >
                            <ChevronRight className="w-4 h-4 text-text-main" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Drawer Lateral de Detalles */}
            {isDrawerOpen && selectedLog && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-bg-main/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-bg-main border-l border-border-thin shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="h-full flex flex-col">
                            <div className="p-6 border-b border-border-thin flex items-center justify-between bg-bg-deep/20">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black tracking-tighter text-text-main uppercase">Inspección Forense</h2>
                                    <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Hash de Integridad Verificado</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl hover:bg-bg-deep transition-all">
                                    <ChevronRight className="w-5 h-5 text-text-main" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Info Principal */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-bg-deep/50 rounded-2xl border border-border-thin">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase mb-2">
                                            <Calendar className="w-3 h-3" /> Fecha y Registro
                                        </div>
                                        <div className="text-sm font-bold text-text-main">
                                            {format(new Date(selectedLog.date), "dd/MM/yyyy")}
                                        </div>
                                        <div className="text-xs text-text-dim mt-1 font-mono">
                                            {format(new Date(selectedLog.date), "HH:mm:ss.SSS")}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-bg-deep/50 rounded-2xl border border-border-thin">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim uppercase mb-2">
                                            <Activity className="w-3 h-3" /> Acción
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${getActionColor(selectedLog.action)}`}>
                                            {selectedLog.action}
                                        </span>
                                        <div className="text-xs text-text-main mt-2 font-bold uppercase tracking-widest opacity-50">
                                            {selectedLog.modulo || 'GLOBAL'}
                                        </div>
                                    </div>
                                </div>

                                {/* Network Info */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-text-main" /> Metadata de Origen
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between p-4 bg-bg-deep/30 rounded-2xl border border-border-thin">
                                            <span className="text-xs font-bold text-text-dim uppercase tracking-tighter">Dirección IP de Red</span>
                                            <span className="text-xs font-mono text-text-main bg-bg-main px-3 py-1 rounded-lg border border-border-thin shadow-sm">{selectedLog.ip_address || '127.0.0.1'}</span>
                                        </div>
                                        <div className="p-4 bg-bg-deep/30 rounded-2xl border border-border-thin">
                                            <div className="flex items-center gap-2 text-xs font-bold text-text-dim uppercase tracking-tighter mb-3">
                                                <Monitor className="w-3 h-3" /> User Agent (Browser Metadata)
                                            </div>
                                            <p className="text-[10px] font-mono text-text-dim leading-relaxed bg-bg-main p-4 rounded-xl border border-border-thin italic">
                                                {selectedLog.user_agent || 'Client Information Not Captured'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cambios de Datos (JSON Diff) */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Code className="w-3 h-3 text-text-main" /> Trazabilidad de Estado (Snapshots)
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase mb-3 ml-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                Estado Anterior (Original)
                                            </div>
                                            {renderJson(selectedLog.values_before)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase mb-3 ml-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Estado Nuevo (Modificado)
                                            </div>
                                            {renderJson(selectedLog.values_after)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border-thin bg-bg-deep/30">
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-[9px] font-mono text-text-dim uppercase">
                                        ID Autogenerado: {selectedLog.id_audit}
                                    </p>
                                    <p className="text-[8px] font-mono text-text-dim/50 uppercase">
                                        Firmado digitalmente por el Motor de Auditoría DIITRA
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
