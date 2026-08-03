import React from 'react';
import { HardDrive, RefreshCw, FileText, Database } from 'lucide-react';
import { useDocumentMaintenance } from './DocumentMaintenance/useDocumentMaintenance';
import { ObsoleteVersionsTab } from './DocumentMaintenance/ObsoleteVersionsTab';
import { BackupsTab } from './DocumentMaintenance/BackupsTab';

interface DocumentMaintenancePageProps {
    isEmbedded?: boolean;
}

const DocumentMaintenancePage: React.FC<DocumentMaintenancePageProps> = ({ isEmbedded = false }) => {
    const {
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
    } = useDocumentMaintenance();

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
                    className="btn-vercel-secondary !py-1.5 !px-3 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    title="Recargar todos los diagnósticos y métricas"
                >
                    <RefreshCw size={12} className={(loadingDocs || loadingBackups || loadingDiskInfo) ? 'animate-spin' : ''} />
                    <span>Refrescar Todo</span>
                </button>
            </header>

            {/* Selector de sub-pestañas */}
            <div className="tabs-vercel !mb-6 flex items-center gap-6">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('versiones')}
                    className={`tab-vercel-item flex items-center gap-2 cursor-pointer ${
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
                    className={`tab-vercel-item flex items-center gap-2 cursor-pointer ${
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

            {/* Contenido Sub-Pestaña 1: Versiones Documentales */}
            {activeSubTab === 'versiones' && (
                <ObsoleteVersionsTab
                    docs={docs}
                    filteredDocs={filteredDocs}
                    loadingDocs={loadingDocs}
                    searchTermDocs={searchTermDocs}
                    setSearchTermDocs={setSearchTermDocs}
                    bulkLoading={bulkLoading}
                    actionLoading={actionLoading}
                    handlePurgeAll={handlePurgeAll}
                    handlePurgeSingle={handlePurgeSingle}
                    totalPhysicalBytesDocs={totalPhysicalBytesDocs}
                    totalPendingCountDocs={totalPendingCountDocs}
                    totalPurgedCountDocs={totalPurgedCountDocs}
                    formatSize={formatSize}
                    formatDate={formatDate}
                />
            )}

            {/* Contenido Sub-Pestaña 2: Copias de Seguridad */}
            {activeSubTab === 'backups' && (
                <BackupsTab
                    backups={backups}
                    filteredBackups={filteredBackups}
                    loadingBackups={loadingBackups}
                    searchTermBackups={searchTermBackups}
                    setSearchTermBackups={setSearchTermBackups}
                    filterStatusBackups={filterStatusBackups}
                    setFilterStatusBackups={setFilterStatusBackups}
                    triggeringBackup={triggeringBackup}
                    handleTriggerBackup={handleTriggerBackup}
                    copiedHash={copiedHash}
                    copyToClipboard={copyToClipboard}
                    handleVerifyIntegrity={handleVerifyIntegrity}
                    verifyingUuid={verifyingUuid}
                    downloadingUuid={downloadingUuid}
                    handleDownloadBackup={handleDownloadBackup}
                    purgingBackupUuid={purgingBackupUuid}
                    handlePurgeBackup={handlePurgeBackup}
                    diskInfo={diskInfo}
                    totalBackupBytes={totalBackupBytes}
                    successfulBackupsCount={successfulBackupsCount}
                    formatSize={formatSize}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
};

export default DocumentMaintenancePage;
