import React, { useState, useEffect } from 'react';
import api from '../../api/axios_config';
import { HardDrive, Trash2, RefreshCw, AlertTriangle, Search, Info } from 'lucide-react';
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

interface DocumentMaintenancePageProps {
    isEmbedded?: boolean;
}

const DocumentMaintenancePage: React.FC<DocumentMaintenancePageProps> = ({ isEmbedded = false }) => {
    const [docs, setDocs] = useState<ObsoleteDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const fetchDiagnosis = async () => {
        setLoading(true);
        try {
            const res = await api.get('/documents/instances/maintenance/diagnose');
            setDocs(res.data || []);
        } catch (err: any) {
            console.error(err);
            addToast("Error de Diagnóstico", "No se pudo cargar la información de almacenamiento de documentos.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiagnosis();
    }, []);

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

    // Cálculos de Diagnóstico con conversión robusta a números
    const totalPhysicalBytes = docs.reduce((acc, curr) => {
        const isPurged = curr.is_file_purged;
        const size = Number(curr.file_size_bytes || 0);
        return acc + (isPurged ? 0 : (isNaN(size) ? 0 : size));
    }, 0);

    const totalPendingCount = docs.filter(d => !d.is_file_purged).length;
    const totalPurgedCount = docs.filter(d => d.is_file_purged).length;

    const formatSize = (bytes: number) => {
        const num = Number(bytes);
        if (isNaN(num) || num <= 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
        return projTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className={isEmbedded ? "space-y-6 animate-fade-up mt-2" : "p-4 md:p-10 space-y-8 animate-fade-up"}>
            {/* Cabecera condicional: completa si es independiente, oculta si está empotrada */}
            {!isEmbedded && (
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-thin/60 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                            <HardDrive size={12} className="text-brand" />
                            <span>Mantenimiento y Almacenamiento</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Ciclo de Vida Documental</h1>
                        <p className="text-xs md:text-sm text-text-dim max-w-2xl leading-relaxed">
                            Depuración y auditoría forense del almacenamiento físico de archivos de prepropuestas y revisiones intermedias obsoletas.
                        </p>
                    </div>
                </header>
            )}

            {/* Tabla de Documentos y Resumen de Almacenamiento en paralelo */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Búsqueda y Lista con estilos y colores del sistema DIITRA */}
                <div className="lg:col-span-3 bento-card p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar por proyecto, documento o autor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-vercel !pl-10 !pr-4 !py-2 !text-xs w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={fetchDiagnosis}
                                disabled={loading}
                                className="btn-vercel-secondary !p-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                                title="Actualizar diagnóstico"
                            >
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                <span>Actualizar</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePurgeAll}
                                disabled={bulkLoading || loading || totalPendingCount === 0}
                                className="btn-vercel-primary flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider !py-2 !px-3"
                            >
                                <Trash2 size={12} />
                                <span>{bulkLoading ? "Depurando..." : "Depuración Masiva"}</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-border-thin border-t-brand"></div>
                            <span className="text-xs text-text-dim">Analizando almacenamiento...</span>
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
                                    {filteredDocs.map(d => {
                                        return (
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Resumen de Almacenamiento con estilo de lista clave-valor */}
                <div className="bento-card-static p-5 space-y-4 lg:col-span-1">
                    <div className="flex items-center gap-2 pb-3 border-b border-border-thin/60">
                        <HardDrive size={16} className="text-text-dim shrink-0" />
                        <h3 className="font-semibold text-text-main text-sm">Resumen de Almacenamiento</h3>
                    </div>
                    <div className="divide-y divide-border-thin/40 text-xs">
                        <div className="flex justify-between items-center py-3">
                            <div className="space-y-0.5">
                                <p className="font-medium text-text-dim">Espacio Ocupado Obsoleto</p>
                                <p className="text-[10px] text-text-dim/80">{totalPendingCount} archivos físicos en disco</p>
                            </div>
                            <p className="font-bold text-text-main text-right">{formatSize(totalPhysicalBytes)}</p>
                        </div>

                        <div className="flex justify-between items-center py-3">
                            <div className="space-y-0.5">
                                <p className="font-medium text-text-dim">Historial de Auditoría</p>
                                <p className="text-[10px] text-text-dim/80">Metadatos sellados en base de datos</p>
                            </div>
                            <p className="font-bold text-text-main text-right">{docs.length} versiones</p>
                        </div>

                        <div className="flex justify-between items-center py-3">
                            <div className="space-y-0.5">
                                <p className="font-medium text-text-dim">Archivos Purgados</p>
                                <p className="text-[10px] text-text-dim/80">Espacio recuperado con éxito</p>
                            </div>
                            <p className="font-bold text-text-main text-right">{totalPurgedCount}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentMaintenancePage;
