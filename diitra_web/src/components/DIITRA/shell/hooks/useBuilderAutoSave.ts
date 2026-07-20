import React, { useState, useEffect, useRef, useCallback } from 'react';
import { coworkLog } from '../../../../core/cowork/utils/log';

export function getMetadataSaveBlockReason(data: any, templateCode: string): string | null {
    if (templateCode !== 'PROTOCOLO_INVESTIGACION') return null;

    const isAssociative =
        data.TieneGrupoInvestigacion === true ||
        data.GrupoInvestigacionTipo === 'SI' ||
        data.GrupoInvestigacionTipo === 'si';

    if (!isAssociative) return null;

    const groupRef =
        data.GrupoInvestigacionUuid ||
        data.GrupoInvestigacion ||
        data.GrupoInvestigacionNombre;

    if (!groupRef || String(groupRef).trim() === '') {
        return 'Para proyectos asociativos debes seleccionar un grupo de investigación aprobado antes de guardar.';
    }

    return null;
}

export const snapshotForm = (data: any): string => {
    try {
        const { Uuid, Titulo, Nombre, ...rest } = data;
        return JSON.stringify({ Uuid, Titulo, Nombre, ...rest });
    } catch { return ''; }
};

export interface UseBuilderAutoSaveProps {
    formData: any;
    templateCode: string;
    readOnly?: boolean;
    localChangeCount?: number;
    remoteChangeCount?: number;
    onSave?: (data: any) => Promise<void>;
    onClose: () => void;
    onUpdateField?: (name: string, value: any) => void;
}

export const useBuilderAutoSave = ({
    formData,
    templateCode,
    readOnly = false,
    localChangeCount = 0,
    remoteChangeCount = 0,
    onSave,
    onClose,
    onUpdateField
}: UseBuilderAutoSaveProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const addAudit = useCallback((msg: string, type: string = 'info') => {
        console.log(`[Audit:${type.toUpperCase()}] ${msg}`);
    }, []);

    const handleToggleSectionLock = useCallback((sectionId: string) => {
        if (onUpdateField) {
            const currentBlocked = formData?.BlockedSections || {};
            const isBlocked = !!currentBlocked[sectionId];
            const newBlocked = { ...currentBlocked, [sectionId]: !isBlocked };
            onUpdateField('BlockedSections', newBlocked);

            addAudit(
                isBlocked
                    ? `Sección '${sectionId.toUpperCase()}' desbloqueada`
                    : `Sección '${sectionId.toUpperCase()}' bloqueada para participantes`,
                isBlocked ? 'info' : 'warning'
            );
        }
    }, [formData?.BlockedSections, onUpdateField, addAudit]);

    // ── Auto-save inteligente del núcleo (dirty-check + debounce 3s) ──
    const lastSavedSnapshotRef = useRef<string>(snapshotForm(formData));
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formDataRef = useRef(formData);
    const onSaveRef = useRef(onSave);
    const isSavingRef = useRef(false);

    const currentSnapshot = snapshotForm(formData);
    const isDirty = currentSnapshot !== lastSavedSnapshotRef.current;

    useEffect(() => { formDataRef.current = formData; }, [formData]);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    // Sincronización de snapshot para colaboradores remotos
    useEffect(() => {
        if (remoteChangeCount === 0) return;
        if (saveTimeoutRef.current !== null || isSavingRef.current) return;

        lastSavedSnapshotRef.current = snapshotForm(formDataRef.current);
        setLastSaved(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, [remoteChangeCount]);

    const saveDirtyData = useCallback(async (isUnmounting = false) => {
        if (readOnly) {
            coworkLog("[DIITRA] saveDirtyData: Documento es sólo lectura, omitiendo guardado.");
            return;
        }
        if (isSavingRef.current) {
            coworkLog("[DIITRA] saveDirtyData: Guardado ya en curso, omitiendo.");
            return;
        }
        const data = formDataRef.current;
        const saveFn = onSaveRef.current;
        if (!saveFn) {
            console.warn("[DIITRA] saveDirtyData: onSave no está definido.");
            return;
        }

        const currentSnap = snapshotForm(data);
        if (currentSnap === lastSavedSnapshotRef.current) {
            coworkLog("[DIITRA] saveDirtyData: Sin cambios que guardar.");
            return;
        }
        if (!data.Uuid && !data.Titulo && !data.Nombre) {
            coworkLog("[DIITRA] saveDirtyData: Formulario vacío, omitiendo guardado.");
            return;
        }

        const saveBlockReason = getMetadataSaveBlockReason(data, templateCode);
        if (saveBlockReason) {
            console.warn(`[DIITRA] saveDirtyData: Guardado omitido — ${saveBlockReason}`);
            if (!isUnmounting) {
                addAudit(saveBlockReason, 'warning');
            }
            return;
        }

        isSavingRef.current = true;
        if (!isUnmounting) {
            setIsSaving(true);
        }
        try {
            coworkLog(`[DIITRA] saveDirtyData: Iniciando guardado. isUnmounting=${isUnmounting}. Payload:`, data);
            await saveFn(data);
            lastSavedSnapshotRef.current = currentSnap;
            coworkLog("[DIITRA] saveDirtyData: Guardado exitoso.");
            if (!isUnmounting) {
                setLastSaved(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
        } catch (error) {
            console.error("[DIITRA] saveDirtyData: Error al guardar en base de datos:", error);
            if (!isUnmounting) {
                addAudit('Error al guardar el documento', 'error');
            }
        } finally {
            isSavingRef.current = false;
            if (!isUnmounting) {
                setIsSaving(false);
            }
        }
    }, [addAudit, readOnly, templateCode]);

    const handleSave = useCallback(async () => {
        if (saveTimeoutRef.current) {
            coworkLog("[DIITRA] handleSave: Cancelando autoguardado programado por guardado manual inmediato.");
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        await saveDirtyData(false);
    }, [saveDirtyData]);

    useEffect(() => {
        if (readOnly) return;
        const currentSnap = snapshotForm(formDataRef.current);
        if (currentSnap === lastSavedSnapshotRef.current) {
            coworkLog("[DIITRA] useEffect AutoSave: Formulario sin cambios.");
            return;
        }
        if (!formDataRef.current.Uuid && !formDataRef.current.Titulo && !formDataRef.current.Nombre) {
            coworkLog("[DIITRA] useEffect AutoSave: Formulario vacío.");
            return;
        }

        coworkLog("[DIITRA] useEffect AutoSave: Cambios detectados. Programando autoguardado en 3s...");
        if (saveTimeoutRef.current) {
            coworkLog("[DIITRA] useEffect AutoSave: Limpiando timeout anterior.");
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            coworkLog("[DIITRA] useEffect AutoSave: Ejecutando autoguardado...");
            handleSave();
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) {
                coworkLog("[DIITRA] useEffect AutoSave Cleanup: Cancelando autoguardado pendiente.");
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [localChangeCount, handleSave, readOnly]);

    // Guardado al desmontar el componente
    const saveDirtyDataRef = useRef(saveDirtyData);
    useEffect(() => {
        saveDirtyDataRef.current = saveDirtyData;
    }, [saveDirtyData]);

    useEffect(() => {
        return () => {
            coworkLog("[DIITRA] DIITRABuilderShell desmontándose (unmount cleanup)...");
            const data = formDataRef.current;
            const currentSnap = snapshotForm(data);
            if (currentSnap !== lastSavedSnapshotRef.current && (data.Uuid || data.Titulo || data.Nombre)) {
                coworkLog("[DIITRA] Guardado forzado al desmontar (unmount).");
                saveDirtyDataRef.current(true);
            } else {
                coworkLog("[DIITRA] No se requiere guardado al desmontar.");
            }
        };
    }, []);

    const handleClose = async () => {
        coworkLog("[DIITRA] handleClose: Iniciando cierre.");
        if (!readOnly && saveTimeoutRef.current) {
            coworkLog("[DIITRA] handleClose: Limpiando timeout y forzando handleSave.");
            clearTimeout(saveTimeoutRef.current);
            await handleSave();
        }
        onClose();
    };

    return {
        isSaving,
        lastSaved,
        isDirty,
        handleSave,
        handleClose,
        handleToggleSectionLock,
        addAudit
    };
};
