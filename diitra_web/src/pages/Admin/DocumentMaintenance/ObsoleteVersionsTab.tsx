import React from 'react';
import { Search, Trash2, AlertTriangle, Info, FileText } from 'lucide-react';
import type { ObsoleteDoc } from './documentMaintenanceTypes';

interface ObsoleteVersionsTabProps {
    docs: ObsoleteDoc[];
    filteredDocs: ObsoleteDoc[];
    loadingDocs: boolean;
    searchTermDocs: string;
    setSearchTermDocs: (term: string) => void;
    bulkLoading: boolean;
    actionLoading: string | null;
    handlePurgeAll: () => void;
    handlePurgeSingle: (uuid: string) => void;
    totalPhysicalBytesDocs: number;
    totalPendingCountDocs: number;
    totalPurgedCountDocs: number;
    formatSize: (bytes: number) => string;
    formatDate: (dateStr: any) => string;
}

export const ObsoleteVersionsTab: React.FC<ObsoleteVersionsTabProps> = ({
    docs,
    filteredDocs,
    loadingDocs,
    searchTermDocs,
    setSearchTermDocs,
    bulkLoading,
    actionLoading,
    handlePurgeAll,
    handlePurgeSingle,
    totalPhysicalBytesDocs,
    totalPendingCountDocs,
    totalPurgedCountDocs,
    formatSize,
    formatDate,
}) => {
    return (
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
                            className="btn-vercel-primary flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider !py-2 !px-3 cursor-pointer"
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
                                                className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

            {/* Resumen lateral */}
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
    );
};
