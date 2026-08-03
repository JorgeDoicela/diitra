export interface ObsoleteDoc {
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

export interface BackupLog {
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

export interface DiskInfo {
    driveName: string;
    driveFormat: string;
    totalSizeBytes: number;
    freeSizeBytes: number;
    usedSizeBytes: number;
    usedPercentage: number;
}
