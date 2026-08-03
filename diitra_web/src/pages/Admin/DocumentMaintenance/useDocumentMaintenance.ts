import { useState, useEffect } from 'react';
import api from '../../../api/axios_config';
import { useNotifications } from '../../../api/NotificationsContext';
import { useConfirm } from '../../../api/ConfirmContext';
import type { ObsoleteDoc, BackupLog, DiskInfo } from './documentMaintenanceTypes';

export const useDocumentMaintenance = () => {
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

    const totalPhysicalBytesDocs = docs.reduce((acc, curr) => {
        const isPurged = curr.is_file_purged;
        const size = Number(curr.file_size_bytes || 0);
        return acc + (isPurged ? 0 : (isNaN(size) ? 0 : size));
    }, 0);
    const totalPendingCountDocs = docs.filter(d => !d.is_file_purged).length;
    const totalPurgedCountDocs = docs.filter(d => d.is_file_purged).length;

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
            return b.estado === 'Exitoso' && b.isFilePresent === false;
        }
        return true;
    });

    return {
        activeSubTab,
        setActiveSubTab,
        docs,
        loadingDocs,
        actionLoading,
        bulkLoading,
        searchTermDocs,
        setSearchTermDocs,
        backups,
        loadingBackups,
        triggeringBackup,
        downloadingUuid,
        verifyingUuid,
        purgingBackupUuid,
        copiedHash,
        searchTermBackups,
        setSearchTermBackups,
        filterStatusBackups,
        setFilterStatusBackups,
        diskInfo,
        loadingDiskInfo,
        fetchDiagnosis,
        fetchBackups,
        fetchDiskInfo,
        handlePurgeSingle,
        handlePurgeAll,
        handleTriggerBackup,
        handleVerifyIntegrity,
        handlePurgeBackup,
        handleDownloadBackup,
        copyToClipboard,
        totalPhysicalBytesDocs,
        totalPendingCountDocs,
        totalPurgedCountDocs,
        totalBackupBytes,
        successfulBackupsCount,
        formatSize,
        formatDate,
        filteredDocs,
        filteredBackups,
    };
};
