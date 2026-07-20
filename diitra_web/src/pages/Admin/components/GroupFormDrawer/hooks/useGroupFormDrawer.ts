import React, { useState } from 'react';
import api from '../../../../../api/axios_config';
import type { GroupFormData, GroupFormDrawerProps } from '../types';
import { useGroupFormDraft } from './useGroupFormDraft';
import { useUserSearch } from './useUserSearch';
import { useGroupMembers } from './useGroupMembers';

export const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export function useGroupFormDrawer({
    isOpen,
    onClose,
    carreras,
    fetchData,
    setConfirmDialog,
    onDraftCleared
}: GroupFormDrawerProps) {
    const [formData, setFormData] = useState<GroupFormData>({
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
    });

    const [selectedCoordName, setSelectedCoordName] = useState('');
    const [selectedCoordCareer, setSelectedCoordCareer] = useState('');

    // Specialized sub-hooks
    const search = useUserSearch();

    const members = useGroupMembers({
        carreras,
        formData,
        setFormData,
        selectedCoordCareer,
        setSelectedCoordName,
        setSelectedCoordCareer,
        setCoordSearchQuery: search.setCoordSearchQuery,
        setShowCoordResults: search.setShowCoordResults,
        setSelectedTeacher: search.setSelectedTeacher,
        setTeacherSearchQuery: search.setTeacherSearchQuery,
        setShowTeacherResults: search.setShowTeacherResults,
        setSelectedStudent: search.setSelectedStudent,
        setStudentSearchQuery: search.setStudentSearchQuery,
        setShowStudentResults: search.setShowStudentResults
    });

    const draft = useGroupFormDraft({
        isOpen,
        formData,
        setFormData,
        selectedCoordName,
        setSelectedCoordName,
        selectedCoordCareer,
        setSelectedCoordCareer,
        groupMembers: members.groupMembers,
        setGroupMembers: members.setGroupMembers,
        onDraftCleared
    });

    const toggleLine = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id)
                ? prev.lineas_ids.filter(lineId => lineId !== id)
                : [...prev.lineas_ids, id]
        }));
    };

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            alert("El nombre de la propuesta es obligatorio.");
            return;
        }
        if (!formData.siglas.trim()) {
            alert("El acrónimo o siglas del grupo es obligatorio.");
            return;
        }
        if (!formData.id_dominio) {
            alert("Debe seleccionar un dominio académico para la propuesta.");
            return;
        }
        if (formData.lineas_ids.length === 0) {
            alert("Debe seleccionar al menos una línea de investigación vinculada.");
            return;
        }

        try {
            const payload = {
                ...formData,
                id_profesor_coordinador: formData.id_profesor_coordinador || null,
                id_dominio: formData.id_dominio ? parseInt(formData.id_dominio) : null,
                miembros: members.groupMembers.map(m => ({
                    id_usuario: m.id_usuario || 0,
                    cedula: m.cedula,
                    nombre_completo: m.nombre_completo,
                    rol: m.rol,
                    activo: true,
                    telefono_contacto: m.telefono_contacto
                }))
            };

            await api.post('/Groups', payload);
            draft.clearDraft();
            onClose();
            fetchData();
        } catch (error: any) {
            console.error('Error saving group:', error);
            const detail = error.response?.data?.detail || error.response?.data?.message || '';
            alert(`Error al guardar el grupo: ${error.message}${detail ? `\n\nDetalle: ${detail}` : ''}`);
        }
    };

    const handleCloseModal = () => {
        const hasChanges =
            formData.nombre.trim() !== '' ||
            formData.siglas.trim() !== '' ||
            formData.objetivo_general.trim() !== '' ||
            formData.mision.trim() !== '' ||
            formData.vision.trim() !== '' ||
            members.groupMembers.length > 0;

        if (hasChanges) {
            setConfirmDialog({
                isOpen: true,
                title: 'Cambios no guardados',
                message: '¿Está seguro de salir? Perderá todos los datos que ha ingresado en este formulario.',
                type: 'warning',
                onConfirm: () => {
                    draft.clearDraft();
                    onClose();
                    setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            draft.clearDraft();
            onClose();
        }
    };

    return {
        isDraftRestored: draft.isDraftRestored,
        discardDraft: draft.discardDraft,
        formData,
        setFormData,
        groupMembers: members.groupMembers,
        selectedCoordName,
        coordSearchQuery: search.coordSearchQuery,
        setCoordSearchQuery: search.setCoordSearchQuery,
        coordSearchResults: search.coordSearchResults,
        isCoordSearching: search.isCoordSearching,
        showCoordResults: search.showCoordResults,
        setShowCoordResults: search.setShowCoordResults,
        handleSelectCoordinator: members.handleSelectCoordinator,

        // Docente
        teacherSearchQuery: search.teacherSearchQuery,
        setTeacherSearchQuery: search.setTeacherSearchQuery,
        teacherPhone: members.teacherPhone,
        setTeacherPhone: members.setTeacherPhone,
        teacherSearchResults: search.teacherSearchResults,
        isTeacherSearching: search.isTeacherSearching,
        showTeacherResults: search.showTeacherResults,
        setShowTeacherResults: search.setShowTeacherResults,
        handleSelectTeacher: members.handleSelectTeacher,
        teacherRol: members.teacherRol,
        setTeacherRol: members.setTeacherRol,
        handleAddTeacher: () => members.handleAddTeacher(search.selectedTeacher),
        selectedTeacher: search.selectedTeacher,

        // Estudiante
        studentSearchQuery: search.studentSearchQuery,
        setStudentSearchQuery: search.setStudentSearchQuery,
        studentPhone: members.studentPhone,
        setStudentPhone: members.setStudentPhone,
        studentSearchResults: search.studentSearchResults,
        isStudentSearching: search.isStudentSearching,
        showStudentResults: search.showStudentResults,
        setShowStudentResults: search.setShowStudentResults,
        handleSelectStudent: members.handleSelectStudent,
        studentRol: members.studentRol,
        setStudentRol: members.setStudentRol,
        handleAddStudent: () => members.handleAddStudent(search.selectedStudent),
        selectedStudent: search.selectedStudent,

        handleRemoveMember: members.handleRemoveMember,
        toggleLine,
        handleSubmitForm,
        handleCloseModal
    };
}
