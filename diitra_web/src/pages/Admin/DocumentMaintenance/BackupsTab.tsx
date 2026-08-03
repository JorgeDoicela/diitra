import React from 'react';
import {
    Search,
    Play,
    AlertTriangle,
    Database,
    HardDrive,
    CheckCircle,
    Info,
    Clock,
    Trash2,
    XCircle,
    Check,
    Copy,
    RefreshCw,
    FileCheck,
    Download
} from 'lucide-react';
import type { BackupLog, DiskInfo } from './documentMaintenanceTypes';

interface BackupsTabProps {
    backups: BackupLog[];
    filteredBackups: BackupLog[];
    loadingBackups: boolean;
    searchTermBackups: string;
    setSearchTermBackups: (term: string) => void;
    filterStatusBackups: 'TODOS' | 'EN_DISCO' | 'PURGADOS';
    setFilterStatusBackups: (status: 'TODOS' | 'EN_DISCO' | 'PURGADOS') => void;
    triggeringBackup: boolean;
    handleTriggerBackup: () => void;
    copiedHash: string | null;
    copyToClipboard: (hash: string) => void;
    handleVerifyIntegrity: (uuid: string) => void;
    verifyingUuid: string | null;
    downloadingUuid: string | null;
    handleDownloadBackup: (uuid: string, filename: string) => void;
    purgingBackupUuid: string | null;
    handlePurgeBackup: (uuid: string, filename: string) => void;
    diskInfo: DiskInfo | null;
    totalBackupBytes: number;
    successfulBackupsCount: number;
    formatSize: (bytes: number) => string;
    formatDate: (dateStr: any) => string;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({
    backups,
    filteredBackups,
    loadingBackups,
    searchTermBackups,
    setSearchTermBackups,
    filterStatusBackups,
    setFilterStatusBackups,
    triggeringBackup,
    handleTriggerBackup,
    copiedHash,
    copyToClipboard,
    handleVerifyIntegrity,
    verifyingUuid,
    downloadingUuid,
    handleDownloadBackup,
    purgingBackupUuid,
    handlePurgeBackup,
    diskInfo,
    totalBackupBytes,
    successfulBackupsCount,
    formatSize,
    formatDate,
}) => {
    return (
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
                                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
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
                                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
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
                                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
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
                            className="btn-vercel-primary flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider !py-2 !px-3 bg-brand cursor-pointer"
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
                                                        className="text-text-dim hover:text-text-main p-1 rounded hover:bg-surface cursor-pointer"
                                                        title="Copiar Checksum completo"
                                                    >
                                                        {copiedHash === b.hashVerificacion ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerifyIntegrity(b.uuid)}
                                                        disabled={verifyingUuid === b.uuid || b.estado === 'Purgado'}
                                                        className="text-brand hover:text-brand-hover p-1 rounded hover:bg-brand/10 transition-colors disabled:opacity-40 cursor-pointer"
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
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadBackup(b.uuid, b.nombreArchivo)}
                                                    disabled={b.estado !== 'Exitoso' || b.isFilePresent === false || downloadingUuid === b.uuid}
                                                    className="p-1.5 rounded-md hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                    title={b.isFilePresent === false ? "El archivo físico ya no está en disco (purga por retención)." : "Descargar respaldo"}
                                                >
                                                    {downloadingUuid === b.uuid ? (
                                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-text-main border-t-transparent"></div>
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handlePurgeBackup(b.uuid, b.nombreArchivo)}
                                                    disabled={b.estado === 'Purgado' || purgingBackupUuid === b.uuid}
                                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-text-dim hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
    );
};
