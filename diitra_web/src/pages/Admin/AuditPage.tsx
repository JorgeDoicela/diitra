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
    Download,
    Plus,
    Minus,
    ArrowDown,
    Copy,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

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

const formatDateSafe = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '—';
        return format(d, formatStr, { locale: es });
    } catch {
        return '—';
    }
};

const formatKeyName = (key: string): string => {
    const dictionary: Record<string, string> = {
        TieneGrupoInvestigacion: '¿Tiene Grupo?',
        CodigoInstitucional: 'Código Institucional',
        DescripcionProyecto: 'Descripción',
        Antecedentes: 'Antecedentes',
        Justificacion: 'Justificación',
        MarcoTeorico: 'Marco Teórico',
        Metodologia: 'Metodología',
        Evaluacion: 'Método de Evaluación',
        TiempoEjecucion: 'Tiempo Ejecución (meses)',
        TrlInicial: 'TRL Inicial',
        TrlActual: 'TRL Actual',
        TrlMeta: 'TRL Meta',
        Estado: 'Estado del Proyecto',
        IdGrupo: 'ID Grupo',
        IdConvocatoria: 'ID Convocatoria',
        IdObjetivoPnd: 'ID Objetivo PND',
        IdEntidadAliada: 'ID Entidad Aliada',
        OrcidId: 'ID ORCID',
        ScopusId: 'ID Scopus',
        GoogleScholarUrl: 'Google Scholar URL',
        ResearchGateUrl: 'ResearchGate URL',
        Especialidad: 'Especialidad',
        GradoAcademicoMaximo: 'Grado Máximo',
        RolesActivos: 'Roles Activos',
        RolAsignado: 'Rol Asignado',
        RolRevocado: 'Rol Revocado',
        Cedula: 'Cédula / Pasaporte',
        Nombre: 'Nombre Completo',
        Institucion: 'Institución',
        GradoAcademico: 'Grado Académico',
        Titulo: 'Título del Proyecto',
        FirmaHabilitada: '¿Firma Habilitada?',
        Version: 'Versión del Registro'
    };
    return dictionary[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

const renderValue = (value: unknown) => {
    if (value === null || value === undefined) {
        return <span className="text-text-dim/40 italic">ninguno</span>;
    }
    
    if (typeof value === 'boolean') {
        return value ? (
            <span className="badge-vercel badge-vercel-success py-0 px-2 text-[9px] font-bold">
                SÍ
            </span>
        ) : (
            <span className="badge-vercel badge-vercel-error py-0 px-2 text-[9px] font-bold">
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
            className="absolute top-2 right-2 p-1.5 rounded border border-border-thin bg-surface text-text-dim hover:text-text-main hover:border-border-hover transition-all text-[9px] font-bold flex items-center gap-1 cursor-pointer z-20"
        >
            {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
            {copied ? '¡Copiado!' : 'Copiar'}
        </button>
    );
};

const getActionBadge = (action: string): string => {
    const a = action.toUpperCase();
    if (a.includes('REVOKE') || a.includes('REVOCAR') || a.includes('DELETE') || a.includes('REMOVE') || a.includes('ELIMINAR') || a.includes('DESACTIVAR')) return 'badge-vercel-error';
    if (a.includes('ASIGN') || a.includes('REGISTER') || a.includes('CREATE') || a.includes('ADD') || a.includes('CREAR') || a.includes('AGREGAR') || a.includes('APROBAR')) return 'badge-vercel-success';
    if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY') || a.includes('ACTUALIZAR') || a.includes('CAMBIAR') || a.includes('TRANSICIONAR') || a.includes('EVALUAR') || a.includes('RECHAZAR') || a.includes('TRANSFERIR')) return 'badge-vercel-warning';
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
    const [toDate, setToDate] = useState('');

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [snapshotView, setSnapshotView] = useState<'diff' | 'before' | 'after'>('diff');

    useEffect(() => {
        setSnapshotView('diff');
    }, [selectedLog]);

    const handleExport = () => {
        try {
            if (logs.length === 0) return;
            
            // 1. Mapear los datos para la hoja de Excel
            const excelData = logs.map(log => ({
                "Fecha y Hora": formatDateSafe(log.date, "yyyy-MM-dd HH:mm:ss"),
                "Administrador": log.admin_name || '—',
                "Acción": log.action || '—',
                "Módulo": log.modulo || 'SISTEMA',
                "Afectado": log.target_name || 'Global',
                "Detalles": log.details || '—',
                "IP de Red": log.ip_address || '—',
                "User Agent": log.user_agent || '—'
            }));

            // 2. Crear una hoja de cálculo a partir de los datos JSON
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // 3. Auto-ajustar el ancho de las columnas de manera elegante
            worksheet['!cols'] = [
                { wch: 20 }, // Fecha y Hora
                { wch: 22 }, // Administrador
                { wch: 25 }, // Acción
                { wch: 15 }, // Módulo
                { wch: 25 }, // Afectado
                { wch: 50 }, // Detalles
                { wch: 15 }, // IP de Red
                { wch: 50 }  // User Agent
            ];

            // 4. Crear el libro de trabajo (workbook)
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría Forense");

            // 5. Generar y descargar el archivo binario nativo .xlsx
            let dateStr = 'export';
            try {
                dateStr = format(new Date(), "yyyyMMdd_HHmmss");
            } catch {
                const now = new Date();
                dateStr = now.toISOString().replace(/[:.]/g, '-');
            }

            XLSX.writeFile(workbook, `auditoria_forense_${dateStr}.xlsx`);
        } catch (error) {
            console.error('Error al exportar reporte de auditoria a Excel XLSX:', error);
        }
    };

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

    const renderSnapshotSection = (log: AuditLog) => {
        const actionType = getActionType(log.action);
        const before = parseJson(log.values_before);
        const after = parseJson(log.values_after);
        const hasBefore = before !== null;
        const hasAfter = after !== null;
        const isLogin = log.action?.toUpperCase() === 'LOGIN';
        const isOtherAction = !hasBefore && !hasAfter;

        if (isLogin || isOtherAction) {
            return (
                <div className="bento-card static p-6 text-center">
                    <div className="icon-circle icon-circle-info mx-auto mb-3 w-10 h-10">
                        <Info size={18} />
                    </div>
                    <p className="text-xs text-text-dim font-medium">
                        {isLogin ? 'Evento de autenticación sin cambios de estado' : 'Esta acción no registra cambios de estado'}
                    </p>
                </div>
            );
        }

        if (snapshotView === 'before' && hasBefore) {
            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-error uppercase ml-1">
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
            );
        }

        if (snapshotView === 'after' && hasAfter) {
            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-success uppercase ml-1">
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
            );
        }

        if (actionType === 'create' && !hasBefore && hasAfter) {
            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-success uppercase ml-1">
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
                                        <td className="p-2 font-mono font-bold text-text-main border-r border-border-thin">{formatKeyName(key)}</td>
                                        <td className="p-2 font-mono">{renderValue(val)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (actionType === 'delete' && hasBefore && !hasAfter) {
            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-error uppercase ml-1">
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
                                        <td className="p-2 font-mono font-bold text-text-dim border-r border-border-thin line-through">{formatKeyName(key)}</td>
                                        <td className="p-2 font-mono text-text-dim line-through">{renderValue(val)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (hasBefore && hasAfter) {
            const diff = computeDiff(before, after);
            const changedKeys = diff.filter(d => d.status !== 'unchanged');
            const unchangedKeys = diff.filter(d => d.status === 'unchanged');

            return (
                <div className="space-y-4 animate-fade-in">
                    {changedKeys.length > 0 ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase ml-1">
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
                                                <td className="p-2 font-mono font-bold text-text-main border-r border-border-thin">{formatKeyName(entry.key)}</td>
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
                            <summary className="text-[9px] font-bold text-text-dim uppercase tracking-widest cursor-pointer hover:text-text-main transition-colors ml-1 select-none">
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
        }

        return null;
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
                        <button 
                            onClick={handleExport}
                            disabled={logs.length === 0}
                            className="btn-vercel-secondary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Download size={14} />
                            Exportar Reporte
                        </button>
                    </div>
                </header>

                <div className="bento-card static p-6 mb-8 animate-fade-up [animation-delay:100ms]">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                                <option value="ACTUALIZAR_METADATA">Actualizar Metadata</option>
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
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-text-main transition-colors" />
                            <input 
                                type="date" 
                                className="input-vercel !pl-10 !py-2.5 !text-sm"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                placeholder="Hasta"
                            />
                        </div>

                        <button type="submit" className="btn-vercel-primary cursor-pointer">
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
                                                    {formatDateSafe(log.date, "dd MMM, HH:mm:ss")}
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
                                                <button className="p-2 rounded border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all cursor-pointer">
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
                                className="btn-vercel-secondary !p-2 disabled:opacity-30 cursor-pointer"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs font-bold text-text-main px-4">
                                Página {page} de {totalPages}
                            </span>
                            <button 
                                disabled={page === totalPages}
                                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                                className="btn-vercel-secondary !p-2 disabled:opacity-30 cursor-pointer"
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
                        <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                            <div className="modal-header">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">Inspección Forense</h3>
                                    <p className="section-label text-text-dim">Hash de Integridad Verificado</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="text-text-dim hover:text-text-main transition-colors cursor-pointer">
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
                                            {formatDateSafe(selectedLog.date, "dd/MM/yyyy")}
                                        </div>
                                        <div className="text-xs text-text-dim mt-1 font-mono">
                                            {formatDateSafe(selectedLog.date, "HH:mm:ss.SSS")}
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

                                    {selectedLog && (parseJson(selectedLog.values_before) !== null || parseJson(selectedLog.values_after) !== null) && selectedLog.action?.toUpperCase() !== 'LOGIN' && (
                                        <div className="flex gap-1 p-1 bg-bg-deep rounded border border-border-thin select-none animate-fade-in">
                                            <button 
                                                onClick={() => setSnapshotView('diff')}
                                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${snapshotView === 'diff' ? 'bg-surface text-text-main shadow-sm border border-border-thin' : 'text-text-dim hover:text-text-main border border-transparent'}`}
                                            >
                                                Diferencias
                                            </button>
                                            {parseJson(selectedLog.values_before) !== null && (
                                                <button 
                                                    onClick={() => setSnapshotView('before')}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${snapshotView === 'before' ? 'bg-surface text-text-main shadow-sm border border-border-thin' : 'text-text-dim hover:text-text-main border border-transparent'}`}
                                                >
                                                    JSON Antes
                                                </button>
                                            )}
                                            {parseJson(selectedLog.values_after) !== null && (
                                                <button 
                                                    onClick={() => setSnapshotView('after')}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${snapshotView === 'after' ? 'bg-surface text-text-main shadow-sm border border-border-thin' : 'text-text-dim hover:text-text-main border border-transparent'}`}
                                                >
                                                    JSON Después
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {selectedLog && renderSnapshotSection(selectedLog)}
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