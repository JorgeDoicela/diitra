import React, { useState, useEffect } from 'react';
import api from '../../api/axios_config';
import { 
    HardDrive, 
    Trash2, 
    RefreshCw, 
    AlertTriangle, 
    Search, 
    Info, 
    FileText, 
    Database, 
    Download, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Copy, 
    Check, 
    Play,
    FileCheck
} from 'lucide-react';
import { useNotifications } from '../../api/NotificationsContext';
import { useConfirm } from '../../api/ConfirmContext';

interface ObsoleteDoc {
    uuid: string;
    project_uuid: string;
    project_title: string;
    document_title: string;
    template_code: string;
    version: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    final_pdf_path: string | null;
    file_hash: string | null;
    is_file_purged: boolean;
    file_size_bytes: number;
    file_size_formatted: string;
    traceability_code: string | null;
    is_backup_version: boolean;
    is_protected_by_retention: boolean;
}

interface BackupLog {
    idBackup: number;
    uuid: string;
    fechaBackup: string;
    tipo: string;
    destino: string;
    nombreArchivo: string;
    tamanioBytes: number;
    estado: string;
    hashVerificacion: string | null;
    errorMensaje: string | null;
    isFilePresent?: boolean;
}

interface DiskInfo {
    driveName: string;
    driveFormat: string;
    totalSizeBytes: number;
    freeSizeBytes: number;
    usedSizeBytes: number;
    usedPercentage: number;
}

interface DocumentMaintenancePageProps {
    isEmbedded?: boolean;
}

const DocumentMaintenancePage: React.FC<DocumentMaintenancePageProps> = ({ isEmbedded = false }) => {
    const [activeSubTab, setActiveSubTab] = useState<'versiones' | 'backups'>('versiones');
    
    // Estados para Versiones Documentales Obsoletas
    const [docs, setDocs] = useState<ObsoleteDoc[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [searchTermDocs, setSearchTermDocs] = useState('');

    // Estados para Copias de Seguridad (Backups)
    const [backups, setBackups] = useState<BackupLog[]>([]);
    const [loadingBackups, setLoadingBackups] = useState(true);
    const [triggeringBackup, setTriggeringBackup] = useState(false);
    const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
    const [verifyingUuid, setVerifyingUuid] = useState<string | null>(null);
    const [purgingBackupUuid, setPurgingBackupUuid] = useState<string | null>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const [searchTermBackups, setSearchTermBackups] = useState('');

    const [filterStatusBackups, setFilterStatusBackups] = useState<'TODOS' | 'EN_DISCO' | 'PURGADOS'>('TODOS');

    // Estado del Disco del Servidor
    const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
    const [loadingDiskInfo, setLoadingDiskInfo] = useState(false);

    const { addToast } = useNotifications();
    const confirm = useConfirm();

    // 1. Obtener diagnóstico de versiones documentales
    const fetchDiagnosis = async () => {
        setLoadingDocs(true);
        try {
            const res = await api.get('/documents/instances/maintenance/diagnose');
            setDocs(res.data || []);
        } catch (err: any) {
            console.error(err);
            addToast("Error de Diagnóstico", "No se pudo cargar la información de almacenamiento de documentos.", "error");
        } finally {
            setLoadingDocs(false);
        }
    };

    // 2. Obtener historial de copias de seguridad
    const fetchBackups = async () => {
        setLoadingBackups(true);
        try {
            const res = await api.get('/admin/backups');
            setBackups(res.data || []);
        } catch (err: any) {
            console.error(err);
            addToast("Error de Backups", "No se pudo obtener el historial de copias de seguridad.", "error");
        } finally {
            setLoadingBackups(false);
        }
    };

    // 3. Obtener métricas del disco del servidor
    const fetchDiskInfo = async () => {
        setLoadingDiskInfo(true);
        try {
            const res = await api.get('/admin/backups/disk-info');
            setDiskInfo(res.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoadingDiskInfo(false);
        }
    };

    useEffect(() => {
        fetchDiagnosis();
        fetchBackups();
        fetchDiskInfo();
    }, []);

    // 4. Polling automático cuando existen respaldos en segundo plano ("En_Proceso")
    useEffect(() => {
        const hasPending = backups.some(b => b.estado === 'En_Proceso');
        if (!hasPending) return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get('/admin/backups');
                const updatedLogs: BackupLog[] = res.data || [];
                setBackups(updatedLogs);
                fetchDiskInfo();

                const stillPending = updatedLogs.some(b => b.estado === 'En_Proceso');
                if (!stillPending) {
                    addToast("Respaldo Completado", "El proceso de copia de seguridad finalizó exitosamente.", "success");
                }
            } catch (e) {
                console.error(e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [backups]);

    // Acciones de Purga Documental
    const handlePurgeSingle = async (uuid: string) => {
        const doc = docs.find(d => d.uuid === uuid);
        if (!doc) return;

        const approved = await confirm({
            title: doc.is_protected_by_retention
                ? "¡Advertencia: Retención CACES!"
                : (doc.is_backup_version ? "¡Advertencia: Archivo de Respaldo!" : "¿Purgar archivo físico?"),
            message: doc.is_protected_by_retention
                ? `Este archivo fue creado recientemente y está protegido por la política de retención obligatoria de evidencias del CACES (5 años). Eliminarlo puede constituir una observación en futuras auditorías de calidad institucional. ¿Deseas forzar su eliminación bajo tu responsabilidad?`
                : (doc.is_backup_version
                    ? `Esta versión (v${doc.version}) es el respaldo recomendado de seguridad inmediatamente anterior al oficial. Si la eliminas, no habrá redundancia física directa para este documento en caso de desastre. ¿Deseas continuar?`
                    : `Esta acción eliminará de forma permanente el PDF físico de la versión preliminar '${doc.document_title}' (v${doc.version}). Los metadatos y el hash SHA-256 de firma se conservarán por auditoría en la base de datos.`),
            confirmText: doc.is_protected_by_retention
                ? "Sí, forzar eliminación"
                : (doc.is_backup_version ? "Entendido, purgar respaldo" : "Sí, purgar archivo"),
            cancelText: "Cancelar",
            variant: "destructive"
        });

        if (!approved) return;

        setActionLoading(uuid);
        try {
            await api.post(`/documents/instances/maintenance/purge/${uuid}`);
            addToast("Archivo Purgado", "El archivo físico ha sido eliminado del almacenamiento con éxito.", "success");
            fetchDiagnosis();
        } catch (err: any) {
            console.error(err);
            addToast("Error al Purgar", err.response?.data?.message ?? "No se pudo eliminar el archivo.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handlePurgeAll = async () => {
        const purgeCandidates = docs.filter(d => !d.is_file_purged && !d.is_backup_version && !d.is_protected_by_retention);
        if (purgeCandidates.length === 0) {
            addToast("Sin Archivos Candidatos", "No hay archivos obsoletos aptos para depuración masiva (los archivos creados hace menos de 5 años están retenidos por el CACES y las versiones de respaldo anterior están protegidas).", "info");
            return;
        }

        const approved = await confirm({
            title: "¿Depuración Masiva de PDFs?",
            message: `¿Estás seguro de purgar los ${purgeCandidates.length} archivos físicos de versiones obsoletas? Esta acción liberará espacio. Por seguridad de continuidad, la depuración automática conservará las versiones de respaldo recomendadas y los archivos con menos de 5 años de antigüedad exigidos por el CACES.`,
            confirmText: "Iniciar Depuración Masiva",
            cancelText: "Cancelar",
            variant: "destructive"
        });

        if (!approved) return;

        setBulkLoading(true);
        try {
            const res = await api.post('/documents/instances/maintenance/purge-all');
            addToast("Depuración Completada", `Se liberaron físicamente ${res.data.count} archivos obsoletos.`, "success");
            fetchDiagnosis();
        } catch (err: any) {
            console.error(err);
            addToast("Error en Depuración", "Ocurrió un error al ejecutar la purga masiva.", "error");
        } finally {
            setBulkLoading(false);
        }
    };

    // Acciones de Copias de Seguridad
    const handleTriggerBackup = async () => {
        const approved = await confirm({
            title: "¿Ejecutar Copia de Seguridad?",
            message: "Se iniciará un respaldo inmediato de la base de datos (tablas DIITRA) y del directorio de archivos adjuntos (uploads) en segundo plano.",
            confirmText: "Iniciar Respaldo Ahora",
            cancelText: "Cancelar",
            variant: "primary"
        });

        if (!approved) return;

        setTriggeringBackup(true);
        try {
            await api.post('/admin/backups/trigger');
            addToast("Copia de Seguridad Iniciada", "El respaldo se está ejecutando en segundo plano. Se actualizará la lista al finalizar.", "info");
            setTimeout(() => {
                fetchBackups();
                fetchDiskInfo();
                setTriggeringBackup(false);
            }, 3500);
        } catch (err: any) {
            console.error(err);
            addToast("Error de Respaldo", err.response?.data?.error ?? "No se pudo iniciar el respaldo.", "error");
            setTriggeringBackup(false);
        }
    };

    const handleVerifyIntegrity = async (uuid: string) => {
        setVerifyingUuid(uuid);
        try {
            const res = await api.post(`/admin/backups/verify/${uuid}`);
            if (res.data.isMatch) {
                addToast("Integridad Confirmada", res.data.message, "success");
            } else {
                addToast("¡Advertencia de Integridad!", res.data.message, "error");
            }
        } catch (err: any) {
            console.error(err);
            addToast("Error de Verificación", "No se pudo verificar el hash del archivo en disco.", "error");
        } finally {
            setVerifyingUuid(null);
        }
    };

    const handlePurgeBackup = async (uuid: string, filename: string) => {
        const approved = await confirm({
            title: "¡Eliminar Archivo de Respaldo!",
            message: `¿Estás seguro de eliminar el archivo físico '${filename}' del disco del servidor? Esta acción es irreversible y se realiza bajo tu responsabilidad por emergencia de almacenamiento.`,
            confirmText: "Sí, Purgar Respaldo",
            cancelText: "Cancelar",
            variant: "destructive"
        });

        if (!approved) return;

        setPurgingBackupUuid(uuid);
        try {
            await api.delete(`/admin/backups/${uuid}`);
            addToast("Respaldo Purgado", "El archivo de copia de seguridad fue eliminado del disco con éxito.", "success");
            fetchBackups();
            fetchDiskInfo();
        } catch (err: any) {
            console.error(err);
            addToast("Error al Purgar", "No se pudo purgar el archivo de respaldo.", "error");
        } finally {
            setPurgingBackupUuid(null);
        }
    };

    const handleDownloadBackup = async (uuid: string, filename: string) => {
        setDownloadingUuid(uuid);
        try {
            const response = await api.get(`/admin/backups/download/${uuid}`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            addToast("Descarga Iniciada", `El archivo ${filename} se ha descargado correctamente.`, "success");
        } catch (err: any) {
            console.error(err);
            addToast("Error de Descarga", "No se pudo descargar el archivo de respaldo o ha sido purgado.", "error");
        } finally {
            setDownloadingUuid(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        addToast("Copiado al Portapapeles", "Texto copiado con éxito.", "success");
        setTimeout(() => setCopiedHash(null), 2500);
    };

    // Cálculos de Diagnóstico Documental
    const totalPhysicalBytesDocs = docs.reduce((acc, curr) => {
        const isPurged = curr.is_file_purged;
        const size = Number(curr.file_size_bytes || 0);
        return acc + (isPurged ? 0 : (isNaN(size) ? 0 : size));
    }, 0);
    const totalPendingCountDocs = docs.filter(d => !d.is_file_purged).length;
    const totalPurgedCountDocs = docs.filter(d => d.is_file_purged).length;

    // Cálculos de Copias de Seguridad
    const totalBackupBytes = backups.reduce((acc, curr) => {
        const size = Number(curr.tamanioBytes || 0);
        return acc + (isNaN(size) ? 0 : size);
    }, 0);
    const successfulBackupsCount = backups.filter(b => b.estado === 'Exitoso').length;

    const formatSize = (bytes: number) => {
        const num = Number(bytes);
        if (isNaN(num) || num <= 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(num) / Math.log(k));
        return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleString('es-EC', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const filteredDocs = docs.filter(d => {
        const projTitle = d.project_title || '';
        const docTitle = d.document_title || '';
        const creator = d.created_by || '';
        return projTitle.toLowerCase().includes(searchTermDocs.toLowerCase()) ||
            docTitle.toLowerCase().includes(searchTermDocs.toLowerCase()) ||
            creator.toLowerCase().includes(searchTermDocs.toLowerCase());
    });

    const filteredBackups = backups.filter(b => {
        const name = b.nombreArchivo || '';
        const tipo = b.tipo || '';
        const matchesSearch = name.toLowerCase().includes(searchTermBackups.toLowerCase()) ||
            tipo.toLowerCase().includes(searchTermBackups.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatusBackups === 'EN_DISCO') {
            return b.estado === 'Exitoso' && b.isFilePresent !== false;
        }
        if (filterStatusBackups === 'PURGADOS') {
            return b.isFilePresent === false || b.estado === 'Purgado';
        }
        return true;
    });

    return (
        <div className={isEmbedded ? "space-y-6 animate-fade-up mt-2" : "p-4 md:p-10 space-y-8 animate-fade-up"}>
            {/* Cabecera / Botón de Acción Superior */}
            <header className={`flex flex-col md:flex-row md:items-center ${isEmbedded ? 'justify-end mb-6' : 'justify-between border-b border-border-thin/60 pb-6 mb-6'} gap-4`}>
                {!isEmbedded && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                            <HardDrive size={12} className="text-brand" />
                            <span>Consola Enterprise de Almacenamiento</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Almacenamiento y Copias de Seguridad</h1>
                        <p className="text-xs md:text-sm text-text-dim max-w-2xl leading-relaxed">
                            Supervisión física del servidor, depuración forense de evidencias CACES e integridad SHA-256 de copias de seguridad.
                        </p>
                    </div>
                )}
                
                <button
                    type="button"
                    onClick={() => { fetchDiagnosis(); fetchBackups(); fetchDiskInfo(); }}
                    className="btn-vercel-secondary !py-1.5 !px-3 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    title="Recargar todos los diagnósticos y métricas"
                >
                    <RefreshCw size={12} className={(loadingDocs || loadingBackups || loadingDiskInfo) ? 'animate-spin' : ''} />
                    <span>Refrescar Todo</span>
                </button>
            </header>

            {/* SELECTOR DE SUB-PESTAÑAS (Vercel Geist Navigation) */}
            <div className="tabs-vercel !mb-6 flex items-center gap-6">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('versiones')}
                    className={`tab-vercel-item flex items-center gap-2 ${
                        activeSubTab === 'versiones' ? 'active' : ''
                    }`}
                >
                    <FileText size={14} />
                    <span>Versiones Documentales</span>
                    <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border-thin text-text-dim font-mono">
                        {totalPendingCountDocs}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSubTab('backups')}
                    className={`tab-vercel-item flex items-center gap-2 ${
                        activeSubTab === 'backups' ? 'active' : ''
                    }`}
                >
                    <Database size={14} />
                    <span>Copias de Seguridad</span>
                    <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border-thin text-text-dim font-mono">
                        {backups.length}
                    </span>
                </button>
            </div>

            {/* CONTENIDO SUB-PESTAÑA 1: VERSIONES DOCUMENTALES (Depuración CACES) */}
            {activeSubTab === 'versiones' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3 bento-card p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                <input
                                    type="text"
                                    placeholder="Buscar por proyecto, documento o autor..."
                                    value={searchTermDocs}
                                    onChange={(e) => setSearchTermDocs(e.target.value)}
                                    className="input-vercel !pl-10 !pr-4 !py-2 !text-xs w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handlePurgeAll}
                                    disabled={bulkLoading || loadingDocs || totalPendingCountDocs === 0}
                                    className="btn-vercel-primary flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider !py-2 !px-3"
                                >
                                    <Trash2 size={12} />
                                    <span>{bulkLoading ? "Depurando..." : "Depuración Masiva"}</span>
                                </button>
                            </div>
                        </div>

                        {loadingDocs ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
                                <span className="text-xs text-text-dim">Analizando almacenamiento documental...</span>
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-2 border border-dashed border-border-thin rounded-lg bg-surface/10">
                                <AlertTriangle size={24} className="text-text-dim" />
                                <span className="text-xs font-semibold text-text-dim">No se encontraron versiones obsoletas</span>
                                <span className="text-[10px] text-text-dim">Todos los documentos están al día o no coinciden con la búsqueda.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-thin text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                                            <th className="py-3 px-4">Proyecto</th>
                                            <th className="py-3 px-4">Documento</th>
                                            <th className="py-3 px-4">Versión</th>
                                            <th className="py-3 px-4">Autor</th>
                                            <th className="py-3 px-4">Fecha</th>
                                            <th className="py-3 px-4">Tamaño</th>
                                            <th className="py-3 px-4">Estado Almacenamiento</th>
                                            <th className="py-3 px-4 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin/40 text-xs">
                                        {filteredDocs.map(d => (
                                            <tr key={d.uuid} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="py-4 px-4 font-semibold text-text-main max-w-[220px] truncate" title={d.project_title}>
                                                    {d.project_title}
                                                </td>
                                                <td className="py-4 px-4 text-text-dim">
                                                    {d.document_title}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2 py-0.5 rounded bg-surface border border-border-thin text-[10px] font-mono text-text-main">
                                                        v{d.version}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-text-dim">
                                                    {d.created_by}
                                                </td>
                                                <td className="py-4 px-4 text-text-dim font-mono text-[11px]">
                                                    {formatDate(d.created_at)}
                                                </td>
                                                <td className="py-4 px-4 font-medium text-text-main">
                                                    {d.file_size_formatted}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {d.is_file_purged ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                                                Purgado
                                                            </span>
                                                            <div className="text-[10px] text-text-dim flex items-center gap-1 truncate max-w-[200px]" title={d.final_pdf_path ?? ""}>
                                                                <Info size={10} />
                                                                {d.final_pdf_path}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                                                                Físico en disco
                                                            </span>
                                                            {d.is_protected_by_retention && (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-text-dim bg-surface border border-border-thin px-1.5 py-0.2 rounded-full uppercase" title="Evidencia protegida por política CACES (Retención 5 años).">
                                                                    Retenido CACES
                                                                </span>
                                                            )}
                                                            {d.is_backup_version && (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-500 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded-full uppercase" title="Respaldo de seguridad de la versión inmediatamente anterior. Se recomienda conservar.">
                                                                    Respaldo Anterior
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePurgeSingle(d.uuid)}
                                                        disabled={d.is_file_purged || actionLoading === d.uuid}
                                                        className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title={d.is_backup_version ? "Purgar respaldo recomendado" : "Purgar archivo físico obsoleto"}
                                                    >
                                                        {actionLoading === d.uuid ? (
                                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-500 border-t-transparent"></div>
                                                        ) : (
                                                            <Trash2 size={13} />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Resumen lateral de preliminares */}
                    <div className="bento-card-static p-5 space-y-4 lg:col-span-1">
                        <div className="flex items-center gap-2 pb-3 border-b border-border-thin/60">
                            <FileText size={16} className="text-text-dim shrink-0" />
                            <h3 className="font-semibold text-text-main text-sm">Resumen de Borradores</h3>
                        </div>
                        <div className="divide-y divide-border-thin/40 text-xs">
                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Espacio Obsoleto</p>
                                    <p className="text-[10px] text-text-dim/80">{totalPendingCountDocs} archivos físicos</p>
                                </div>
                                <p className="font-bold text-text-main text-right">{formatSize(totalPhysicalBytesDocs)}</p>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Historial de Auditoría</p>
                                    <p className="text-[10px] text-text-dim/80">Metadatos en DB</p>
                                </div>
                                <p className="font-bold text-text-main text-right">{docs.length} versiones</p>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Archivos Purgados</p>
                                    <p className="text-[10px] text-text-dim/80">Espacio liberado</p>
                                </div>
                                <p className="font-bold text-text-main text-right">{totalPurgedCountDocs}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENIDO SUB-PESTAÑA 2: COPIAS DE SEGURIDAD (BACKUPS ENTERPRISE) */}
            {activeSubTab === 'backups' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3 bento-card p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 flex-1">
                                <div className="relative flex-1 min-w-[200px] max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre de archivo o tipo..."
                                        value={searchTermBackups}
                                        onChange={(e) => setSearchTermBackups(e.target.value)}
                                        className="input-vercel !pl-10 !pr-4 !py-2 !text-xs w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-surface border border-border-thin rounded-lg p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatusBackups('TODOS')}
                                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                            filterStatusBackups === 'TODOS'
                                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                                                : 'text-text-dim hover:text-text-main'
                                        }`}
                                    >
                                        Todos ({backups.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatusBackups('EN_DISCO')}
                                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                            filterStatusBackups === 'EN_DISCO'
                                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                                                : 'text-text-dim hover:text-text-main'
                                        }`}
                                    >
                                        En Disco ({backups.filter(b => b.estado === 'Exitoso' && b.isFilePresent !== false).length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatusBackups('PURGADOS')}
                                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                            filterStatusBackups === 'PURGADOS'
                                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                                                : 'text-text-dim hover:text-text-main'
                                        }`}
                                    >
                                        Retenidos / Purgados ({backups.filter(b => b.isFilePresent === false || b.estado === 'Purgado').length})
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleTriggerBackup}
                                    disabled={triggeringBackup}
                                    className="btn-vercel-primary flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider !py-2 !px-3 bg-brand"
                                >
                                    <Play size={12} className={triggeringBackup ? 'animate-spin' : ''} />
                                    <span>{triggeringBackup ? "Generando Respaldo..." : "Generar Respaldo Ahora"}</span>
                                </button>
                            </div>
                        </div>

                        {loadingBackups ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
                                <span className="text-xs text-text-dim">Cargando historial de copias de seguridad...</span>
                            </div>
                        ) : filteredBackups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-2 border border-dashed border-border-thin rounded-lg bg-surface/10">
                                <AlertTriangle size={24} className="text-text-dim" />
                                <span className="text-xs font-semibold text-text-dim">No se registraron copias de seguridad</span>
                                <span className="text-[10px] text-text-dim">Ejecute una copia manual o espere el ciclo programado de las 02:00 AM.</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-thin text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                                            <th className="py-3 px-4">Tipo</th>
                                            <th className="py-3 px-4">Nombre de Archivo</th>
                                            <th className="py-3 px-4">Fecha y Hora</th>
                                            <th className="py-3 px-4">Tamaño</th>
                                            <th className="py-3 px-4">Estado</th>
                                            <th className="py-3 px-4">Integridad Hash SHA-256</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin/40 text-xs">
                                        {filteredBackups.map(b => (
                                            <tr key={b.uuid} className="hover:bg-surface-hover/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <span className="badge-vercel text-[11px] font-mono text-text-main bg-surface border border-border-thin">
                                                        {b.tipo === 'BaseDatos' ? <Database size={11} className="text-text-dim" /> : <HardDrive size={11} className="text-text-dim" />}
                                                        <span>{b.tipo === 'BaseDatos' ? 'BaseDatos (.sql)' : 'Uploads (.zip)'}</span>
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 font-mono font-medium text-text-main max-w-[200px] truncate" title={b.nombreArchivo}>
                                                    {b.nombreArchivo}
                                                </td>
                                                <td className="py-4 px-4 text-text-dim font-mono text-[11px]">
                                                    {formatDate(b.fechaBackup)}
                                                </td>
                                                <td className="py-4 px-4 font-medium text-text-main">
                                                    {formatSize(b.tamanioBytes)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {b.estado === 'Exitoso' ? (
                                                        b.isFilePresent !== false ? (
                                                            <span className="badge-vercel badge-vercel-success text-[11px]" title="Archivo físico listo en disco">
                                                                <CheckCircle size={11} /> Exitoso (En Disco)
                                                            </span>
                                                        ) : (
                                                            <span className="badge-vercel badge-vercel-warning text-[11px]" title="El archivo físico fue depurado por la política de retención (30 días).">
                                                                <Info size={11} /> Purga por Retención
                                                            </span>
                                                        )
                                                    ) : b.estado === 'En_Proceso' ? (
                                                        <span className="badge-vercel badge-vercel-info text-[11px]">
                                                            <Clock size={11} className="animate-spin" /> En Proceso
                                                        </span>
                                                    ) : b.estado === 'Purgado' ? (
                                                        <span className="badge-vercel text-[11px] text-text-dim border-border-thin" title={b.errorMensaje ?? "Archivo eliminado"}>
                                                            <Trash2 size={11} /> Purgado
                                                        </span>
                                                    ) : (
                                                        <span className="badge-vercel badge-vercel-error text-[11px]" title={b.errorMensaje ?? "Falló el respaldo"}>
                                                            <XCircle size={11} /> Fallido
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {b.hashVerificacion ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <code className="text-[10px] font-mono text-text-dim bg-surface border border-border-thin px-1.5 py-0.5 rounded max-w-[120px] truncate" title={b.hashVerificacion}>
                                                                {b.hashVerificacion.substring(0, 14)}...
                                                            </code>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(b.hashVerificacion!)}
                                                                className="text-text-dim hover:text-text-main p-1 rounded hover:bg-surface"
                                                                title="Copiar Checksum completo"
                                                            >
                                                                {copiedHash === b.hashVerificacion ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerifyIntegrity(b.uuid)}
                                                                disabled={verifyingUuid === b.uuid || b.estado === 'Purgado'}
                                                                className="text-brand hover:text-brand-hover p-1 rounded hover:bg-brand/10 transition-colors disabled:opacity-40"
                                                                title="Re-verificar integridad SHA-256 en vivo"
                                                            >
                                                                {verifyingUuid === b.uuid ? <RefreshCw size={11} className="animate-spin" /> : <FileCheck size={11} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-text-dim italic">N/A</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Botón Descargar */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadBackup(b.uuid, b.nombreArchivo)}
                                                            disabled={b.estado !== 'Exitoso' || b.isFilePresent === false || downloadingUuid === b.uuid}
                                                            className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={b.isFilePresent === false ? "El archivo físico ya no está en disco (purga por retención)." : "Descargar respaldo"}
                                                        >
                                                            {downloadingUuid === b.uuid ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-text-main border-t-transparent"></div>
                                                            ) : (
                                                                <Download size={14} />
                                                            )}
                                                        </button>

                                                        {/* Botón Purga Manual */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePurgeBackup(b.uuid, b.nombreArchivo)}
                                                            disabled={b.estado === 'Purgado' || purgingBackupUuid === b.uuid}
                                                            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-dim hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Eliminar respaldo de la BD y del disco"
                                                        >
                                                            {purgingBackupUuid === b.uuid ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-500 border-t-transparent"></div>
                                                            ) : (
                                                                <Trash2 size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Resumen lateral de Backups & Disco */}
                    <div className="bento-card-static p-5 space-y-4 lg:col-span-1">
                        <div className="flex items-center gap-2 pb-3 border-b border-border-thin/60">
                            <Database size={16} className="text-brand shrink-0" />
                            <h3 className="font-semibold text-text-main text-sm">Resumen de Respaldos</h3>
                        </div>
                        <div className="divide-y divide-border-thin/40 text-xs">
                            {/* Disco del Servidor */}
                            <div className="py-3 space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-text-dim">Disco Servidor ({diskInfo?.driveName ?? 'C:\\'})</p>
                                    <p className="font-bold text-text-main text-right">{diskInfo ? formatSize(diskInfo.freeSizeBytes) : '...'}</p>
                                </div>
                                <p className="text-[10px] text-text-dim/80 flex justify-between">
                                    <span>Libres de {diskInfo ? formatSize(diskInfo.totalSizeBytes) : '...'}</span>
                                    <span>{diskInfo?.usedPercentage ?? 0}% Ocupado</span>
                                </p>
                                <div className="w-full bg-surface border border-border-thin rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${
                                            (diskInfo?.usedPercentage ?? 0) > 85 ? 'bg-red-500' : (diskInfo?.usedPercentage ?? 0) > 70 ? 'bg-amber-500' : 'bg-sky-500'
                                        }`}
                                        style={{ width: `${diskInfo?.usedPercentage ?? 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Almacenamiento Usado</p>
                                    <p className="text-[10px] text-text-dim/80">{backups.length} volcados de seguridad</p>
                                </div>
                                <p className="font-bold text-text-main text-right">{formatSize(totalBackupBytes)}</p>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Frecuencia Programada</p>
                                    <p className="text-[10px] text-text-dim/80">Ejecución nocturna CRON</p>
                                </div>
                                <p className="font-bold text-text-main text-right">02:00 AM</p>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Retención Automática</p>
                                    <p className="text-[10px] text-text-dim/80">Limpieza de volcados antiguos</p>
                                </div>
                                <p className="font-bold text-text-main text-right">30 días</p>
                            </div>

                            <div className="flex justify-between items-center py-3">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-text-dim">Respaldos Exitosos</p>
                                    <p className="text-[10px] text-text-dim/80">Total en el historial</p>
                                </div>
                                <p className="font-bold text-emerald-500 text-right">{successfulBackupsCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentMaintenancePage;
