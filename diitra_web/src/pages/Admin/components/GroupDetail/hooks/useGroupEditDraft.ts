import { useState, useEffect, useRef } from 'react';
import api from '../../../../../api/axios_config';
import type { Group } from '../useGroupDetail';

interface UseGroupEditDraftProps {
    isOpen: boolean;
    detailGroup: Group | null;
    isEditingInitial?: boolean;
    fetchData?: () => void;
    refreshGroupDetail: () => Promise<void>;
    onClose: () => void;
    confirm: (options: any) => Promise<boolean>;
    setIsFieldModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveFieldKey: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useGroupEditDraft = ({
    isOpen,
    detailGroup,
    isEditingInitial,
    fetchData,
    refreshGroupDetail,
    onClose,
    confirm,
    setIsFieldModalOpen,
    setActiveFieldKey
}: UseGroupEditDraftProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [savingInline, setSavingInline] = useState(false);
    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const isInitializedRef = useRef(false);

    const [editFormData, setEditFormData] = useState({
        nombre: '',
        siglas: '',
        tipo_grupo: 'Investigación',
        id_dominio: '',
        id_profesor_coordinador: '',
        objetivo_general: '',
        mision: '',
        vision: '',
        resolucion_aprobacion: '',
        fecha_creacion: '',
        categoria_consolidacion: 'En Formación',
        lineas_ids: [] as number[],
        carreras_ids: [] as number[],
        link_whatsapp: '',
        telefono_coordinador: ''
    });

    const [selectedCoordName, setSelectedCoordName] = useState('');

    const clearDraft = () => {
        if (detailGroup) {
            localStorage.removeItem(`edit_group_form_draft_${detailGroup.uuid}`);
            localStorage.removeItem('groups_draft_metadata');
            setIsDraftRestored(false);
            window.dispatchEvent(new CustomEvent('diitra:group-draft-cleared'));

            setEditFormData({
                nombre: detailGroup.nombre || '',
                siglas: detailGroup.siglas || '',
                tipo_grupo: detailGroup.tipo_grupo || 'Investigación',
                id_dominio: detailGroup.id_dominio ? detailGroup.id_dominio.toString() : '',
                id_profesor_coordinador: detailGroup.id_profesor_coordinador || '',
                objetivo_general: detailGroup.objetivo_general || '',
                mision: detailGroup.mision || '',
                vision: detailGroup.vision || '',
                resolucion_aprobacion: detailGroup.resolucion_aprobacion || '',
                fecha_creacion: detailGroup.fecha_creacion ? detailGroup.fecha_creacion.split('T')[0] : '',
                categoria_consolidacion: detailGroup.categoria_consolidacion || 'En Formación',
                lineas_ids: detailGroup.lineas_ids || [],
                carreras_ids: detailGroup.carreras_ids || [],
                link_whatsapp: detailGroup.link_whatsapp || '',
                telefono_coordinador: detailGroup.telefono_coordinador || ''
            });
            setSelectedCoordName(detailGroup.nombre_coordinador || '');
        }
    };

    const toggleLine = (lineId: number) => {
        setEditFormData(prev => {
            const linesList = prev.lineas_ids.includes(lineId)
                ? prev.lineas_ids.filter(id => id !== lineId)
                : [...prev.lineas_ids, lineId];
            return { ...prev, lineas_ids: linesList };
        });
    };

    // Load draft
    useEffect(() => {
        if (!isOpen || !detailGroup?.uuid) {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
            return;
        }

        if (isEditing) {
            const draftKey = `edit_group_form_draft_${detailGroup.uuid}`;
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed && typeof parsed === 'object' && parsed.formData) {
                        setEditFormData(parsed.formData);
                        setSelectedCoordName(parsed.selectedCoordName || '');
                        setIsDraftRestored(true);
                        isInitializedRef.current = true;
                        return;
                    }
                } catch (e) {
                    console.error("Error reading draft", e);
                }
            }

            setEditFormData({
                nombre: detailGroup.nombre || '',
                siglas: detailGroup.siglas || '',
                tipo_grupo: detailGroup.tipo_grupo || 'Investigación',
                id_dominio: detailGroup.id_dominio ? detailGroup.id_dominio.toString() : '',
                id_profesor_coordinador: detailGroup.id_profesor_coordinador || '',
                objetivo_general: detailGroup.objetivo_general || '',
                mision: detailGroup.mision || '',
                vision: detailGroup.vision || '',
                resolucion_aprobacion: detailGroup.resolucion_aprobacion || '',
                fecha_creacion: detailGroup.fecha_creacion ? detailGroup.fecha_creacion.split('T')[0] : '',
                categoria_consolidacion: detailGroup.categoria_consolidacion || 'En Formación',
                lineas_ids: detailGroup.lineas_ids || [],
                carreras_ids: detailGroup.carreras_ids || [],
                link_whatsapp: detailGroup.link_whatsapp || '',
                telefono_coordinador: detailGroup.telefono_coordinador || ''
            });
            setSelectedCoordName(detailGroup.nombre_coordinador || '');
            setIsDraftRestored(false);
            isInitializedRef.current = true;
        } else {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
        }
    }, [isEditing, detailGroup, isOpen]);

    const hasChangesFromDb = () => {
        if (!detailGroup) return false;
        
        const dbNombre = detailGroup.nombre || '';
        const dbSiglas = detailGroup.siglas || '';
        const dbTipo = detailGroup.tipo_grupo || 'Investigación';
        const dbDominio = detailGroup.id_dominio ? detailGroup.id_dominio.toString() : '';
        const dbCoord = detailGroup.id_profesor_coordinador || '';
        const dbObjetivo = detailGroup.objetivo_general || '';
        const dbMision = detailGroup.mision || '';
        const dbVision = detailGroup.vision || '';
        const dbResolucion = detailGroup.resolucion_aprobacion || '';
        const dbFecha = detailGroup.fecha_creacion ? detailGroup.fecha_creacion.split('T')[0] : '';
        const dbCat = detailGroup.categoria_consolidacion || 'En Formación';
        const dbLines = detailGroup.lineas_ids || [];
        const dbWhatsapp = detailGroup.link_whatsapp || '';
        const dbTel = detailGroup.telefono_coordinador || '';

        const sameLines = JSON.stringify(editFormData.lineas_ids.slice().sort()) === JSON.stringify(dbLines.slice().sort());

        return (
            editFormData.nombre !== dbNombre ||
            editFormData.siglas !== dbSiglas ||
            editFormData.tipo_grupo !== dbTipo ||
            editFormData.id_dominio !== dbDominio ||
            editFormData.id_profesor_coordinador !== dbCoord ||
            editFormData.objetivo_general !== dbObjetivo ||
            editFormData.mision !== dbMision ||
            editFormData.vision !== dbVision ||
            editFormData.resolucion_aprobacion !== dbResolucion ||
            editFormData.fecha_creacion !== dbFecha ||
            editFormData.categoria_consolidacion !== dbCat ||
            !sameLines ||
            editFormData.link_whatsapp !== dbWhatsapp ||
            editFormData.telefono_coordinador !== dbTel
        );
    };

    const handleCloseAttempt = async (action: 'cancel-edit' | 'close-drawer') => {
        if (isEditing && hasChangesFromDb()) {
            const hasConfirmed = await confirm({
                title: 'Salir de la Edición',
                message: 'Tiene cambios no guardados en el borrador de edición. ¿Está seguro de que desea salir? Se perderán las modificaciones.',
                variant: 'warning',
                confirmText: 'Salir',
                cancelText: 'Permanecer'
            });
            if (!hasConfirmed) return;
        }
 
        if (action === 'cancel-edit') {
            setIsEditing(false);
            if (detailGroup) {
                setEditFormData({
                    nombre: detailGroup.nombre || '',
                    siglas: detailGroup.siglas || '',
                    tipo_grupo: detailGroup.tipo_grupo || 'Investigación',
                    id_dominio: detailGroup.id_dominio ? detailGroup.id_dominio.toString() : '',
                    id_profesor_coordinador: detailGroup.id_profesor_coordinador || '',
                    objetivo_general: detailGroup.objetivo_general || '',
                    mision: detailGroup.mision || '',
                    vision: detailGroup.vision || '',
                    resolucion_aprobacion: detailGroup.resolucion_aprobacion || '',
                    fecha_creacion: detailGroup.fecha_creacion ? detailGroup.fecha_creacion.split('T')[0] : '',
                    categoria_consolidacion: detailGroup.categoria_consolidacion || 'En Formación',
                    lineas_ids: detailGroup.lineas_ids || [],
                    carreras_ids: detailGroup.carreras_ids || [],
                    link_whatsapp: detailGroup.link_whatsapp || '',
                    telefono_coordinador: detailGroup.telefono_coordinador || ''
                });
                setSelectedCoordName(detailGroup.nombre_coordinador || '');
            }
        } else if (action === 'close-drawer') {
            onClose();
            setIsFieldModalOpen(false);
            setActiveFieldKey(null);
        }
    };

    // Autosave draft
    useEffect(() => {
        if (!isOpen || !detailGroup || !isEditing || !isInitializedRef.current) return;

        const draftKey = `edit_group_form_draft_${detailGroup.uuid}`;

        if (!hasChangesFromDb()) {
            if (localStorage.getItem(draftKey)) {
                localStorage.removeItem(draftKey);
                const metaStr = localStorage.getItem('groups_draft_metadata');
                if (metaStr) {
                    try {
                        const meta = JSON.parse(metaStr);
                        if (meta.type === 'edit' && meta.uuid === detailGroup.uuid) {
                            localStorage.removeItem('groups_draft_metadata');
                            window.dispatchEvent(new CustomEvent('diitra:group-draft-cleared'));
                        }
                    } catch (e) {}
                }
            }
            return;
        }

        const draftData = {
            formData: editFormData,
            selectedCoordName,
            timestamp: Date.now()
        };

        localStorage.setItem(draftKey, JSON.stringify(draftData));

        const meta = {
            type: 'edit',
            uuid: detailGroup.uuid,
            groupName: editFormData.nombre || detailGroup.nombre || 'Borrador sin nombre',
            timestamp: Date.now()
        };
        localStorage.setItem('groups_draft_metadata', JSON.stringify(meta));
        window.dispatchEvent(new CustomEvent('diitra:group-draft-cleared'));
    }, [editFormData, selectedCoordName, isEditing, detailGroup, isOpen]);

    const handleSaveInlineChanges = async () => {
        if (!detailGroup?.uuid) return;

        if (!editFormData.nombre.trim()) {
            alert("El nombre de la propuesta de grupo es obligatorio.");
            return;
        }
        if (!editFormData.siglas.trim()) {
            alert("El acrónimo o siglas del grupo es obligatorio.");
            return;
        }
        if (!editFormData.id_dominio) {
            alert("Debe seleccionar un dominio académico para el grupo.");
            return;
        }
        if (editFormData.lineas_ids.length === 0) {
            alert("Debe seleccionar al menos una línea de investigación vinculada.");
            return;
        }

        setSavingInline(true);
        try {
            const payload = {
                ...editFormData,
                id_profesor_coordinador: editFormData.id_profesor_coordinador || null,
                id_dominio: editFormData.id_dominio ? parseInt(editFormData.id_dominio) : null,
                miembros: []
            };

            await api.put(`/Groups/${detailGroup.uuid}`, payload);
            clearDraft();
            await refreshGroupDetail();
            setIsEditing(false);
            if (fetchData) {
                fetchData();
            }
        } catch (err: any) {
            console.error("Error al guardar cambios de grupo:", err);
            alert("No se pudieron guardar los cambios: " + (err.response?.data?.message || err.message));
        } finally {
            setSavingInline(false);
        }
    };

    return {
        isEditing,
        setIsEditing,
        savingInline,
        isDraftRestored,
        editFormData,
        setEditFormData,
        selectedCoordName,
        setSelectedCoordName,
        clearDraft,
        toggleLine,
        hasChangesFromDb,
        handleCloseAttempt,
        handleSaveInlineChanges
    };
};
