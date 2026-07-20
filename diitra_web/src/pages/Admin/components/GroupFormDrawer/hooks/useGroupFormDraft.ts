import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import type { GroupFormData, GroupMember } from '../types';

const DRAFT_KEY = 'new_group_form_draft';
const META_KEY = 'groups_draft_metadata';

const initialFormData: GroupFormData = {
    nombre: '',
    siglas: '',
    tipo_grupo: 'Investigación',
    id_dominio: '',
    id_profesor_coordinador: '',
    objetivo_general: '',
    mision: '',
    vision: '',
    resolucion_aprobacion: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
    categoria_consolidacion: 'En Formación',
    lineas_ids: [],
    carreras_ids: [],
    link_whatsapp: '',
    telefono_coordinador: ''
};

interface UseGroupFormDraftProps {
    isOpen: boolean;
    formData: GroupFormData;
    setFormData: Dispatch<SetStateAction<GroupFormData>>;
    selectedCoordName: string;
    setSelectedCoordName: Dispatch<SetStateAction<string>>;
    selectedCoordCareer: string;
    setSelectedCoordCareer: Dispatch<SetStateAction<string>>;
    groupMembers: GroupMember[];
    setGroupMembers: Dispatch<SetStateAction<GroupMember[]>>;
    onDraftCleared?: () => void;
}

export function useGroupFormDraft({
    isOpen,
    formData,
    setFormData,
    selectedCoordName,
    setSelectedCoordName,
    selectedCoordCareer,
    setSelectedCoordCareer,
    groupMembers,
    setGroupMembers,
    onDraftCleared
}: UseGroupFormDraftProps) {
    const isInitializedRef = useRef(false);
    const [isDraftRestored, setIsDraftRestored] = useState(false);

    // Load draft when drawer opens
    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
            return;
        }

        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                    const validatedFormData: GroupFormData = {
                        nombre: parsed.formData.nombre || '',
                        siglas: parsed.formData.siglas || '',
                        tipo_grupo: parsed.formData.tipo_grupo || 'Investigación',
                        id_dominio: parsed.formData.id_dominio || '',
                        id_profesor_coordinador: parsed.formData.id_profesor_coordinador || '',
                        objetivo_general: parsed.formData.objetivo_general || '',
                        mision: parsed.formData.mision || '',
                        vision: parsed.formData.vision || '',
                        resolucion_aprobacion: parsed.formData.resolucion_aprobacion || '',
                        fecha_creacion: parsed.formData.fecha_creacion || '',
                        categoria_consolidacion: parsed.formData.categoria_consolidacion || 'En Formación',
                        lineas_ids: Array.isArray(parsed.formData.lineas_ids) ? parsed.formData.lineas_ids : [],
                        carreras_ids: Array.isArray(parsed.formData.carreras_ids) ? parsed.formData.carreras_ids : [],
                        link_whatsapp: parsed.formData.link_whatsapp || '',
                        telefono_coordinador: parsed.formData.telefono_coordinador || ''
                    };
                    setFormData(validatedFormData);
                    setSelectedCoordName(parsed.selectedCoordName || '');
                    setSelectedCoordCareer(parsed.selectedCoordCareer || '');
                    setGroupMembers(Array.isArray(parsed.groupMembers) ? parsed.groupMembers : []);
                    setIsDraftRestored(true);
                    isInitializedRef.current = true;
                    return;
                }
            } catch (e) {
                console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(META_KEY);
            }
        }

        setFormData(initialFormData);
        setSelectedCoordName('');
        setSelectedCoordCareer('');
        setGroupMembers([]);
        setIsDraftRestored(false);
        isInitializedRef.current = true;
    }, [isOpen]);

    // Auto-save draft on state changes
    useEffect(() => {
        if (!isOpen || !isInitializedRef.current) return;

        const draftData = {
            formData,
            selectedCoordName,
            selectedCoordCareer,
            groupMembers
        };

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        const meta = {
            type: 'new',
            groupName: formData.nombre || 'Borrador de Nueva Propuesta',
            timestamp: Date.now()
        };
        localStorage.setItem(META_KEY, JSON.stringify(meta));
    }, [formData, selectedCoordName, selectedCoordCareer, groupMembers, isOpen]);

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(META_KEY);
        if (onDraftCleared) {
            onDraftCleared();
        }
    };

    const discardDraft = () => {
        setFormData(initialFormData);
        setSelectedCoordName('');
        setSelectedCoordCareer('');
        setGroupMembers([]);
        clearDraft();
        setIsDraftRestored(false);
    };

    return {
        isDraftRestored,
        discardDraft,
        clearDraft
    };
}
