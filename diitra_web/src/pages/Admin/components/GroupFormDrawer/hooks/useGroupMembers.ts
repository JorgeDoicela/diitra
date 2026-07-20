import { useState, Dispatch, SetStateAction } from 'react';
import type { GroupMember, Career, GroupFormData } from '../types';

interface UseGroupMembersProps {
    carreras: Career[];
    formData: GroupFormData;
    setFormData: Dispatch<SetStateAction<GroupFormData>>;
    selectedCoordCareer: string;
    setSelectedCoordName: Dispatch<SetStateAction<string>>;
    setSelectedCoordCareer: Dispatch<SetStateAction<string>>;
    setCoordSearchQuery: Dispatch<SetStateAction<string>>;
    setShowCoordResults: Dispatch<SetStateAction<boolean>>;
    setSelectedTeacher: Dispatch<SetStateAction<any | null>>;
    setTeacherSearchQuery: Dispatch<SetStateAction<string>>;
    setShowTeacherResults: Dispatch<SetStateAction<boolean>>;
    setSelectedStudent: Dispatch<SetStateAction<any | null>>;
    setStudentSearchQuery: Dispatch<SetStateAction<string>>;
    setShowStudentResults: Dispatch<SetStateAction<boolean>>;
}

export function useGroupMembers({
    carreras,
    formData,
    setFormData,
    selectedCoordCareer,
    setSelectedCoordName,
    setSelectedCoordCareer,
    setCoordSearchQuery,
    setShowCoordResults,
    setSelectedTeacher,
    setTeacherSearchQuery,
    setShowTeacherResults,
    setSelectedStudent,
    setStudentSearchQuery,
    setShowStudentResults
}: UseGroupMembersProps) {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [teacherPhone, setTeacherPhone] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [teacherRol, setTeacherRol] = useState('Co-Investigador');
    const [studentRol, setStudentRol] = useState('Semillerista');

    const recalculateCarreras = (coordCareer: string, members: GroupMember[]) => {
        const uniqueIds = new Set<number>();
        const getMatchedIds = (careerStr: string) => {
            const careersList = careerStr.split(',').map((c: string) => c.trim().toUpperCase());
            return carreras
                .filter(c => careersList.includes(c.carrera1.trim().toUpperCase()))
                .map(c => c.id_carrera);
        };

        if (coordCareer) {
            getMatchedIds(coordCareer).forEach(id => uniqueIds.add(id));
        }

        members.forEach(m => {
            if (m.carrera) {
                getMatchedIds(m.carrera).forEach(id => uniqueIds.add(id));
            }
        });

        return Array.from(uniqueIds);
    };

    const handleSelectCoordinator = (teacher: any) => {
        if (groupMembers.some(m => m.cedula === teacher.cedula)) {
            alert("Este docente ya es un integrante del grupo y no puede ser asignado como Coordinador Responsable.");
            return;
        }

        const updatedCarreras = recalculateCarreras(teacher.carrera || '', groupMembers);
        setFormData(prev => ({
            ...prev,
            id_profesor_coordinador: teacher.cedula,
            carreras_ids: updatedCarreras
        }));

        setSelectedCoordName(teacher.nombre);
        setSelectedCoordCareer(teacher.carrera || '');
        setCoordSearchQuery('');
        setShowCoordResults(false);
    };

    const handleSelectTeacher = (teacher: any) => {
        setSelectedTeacher(teacher);
        setTeacherSearchQuery(teacher.nombre);
        setShowTeacherResults(false);
        setTeacherRol('Co-Investigador');
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setStudentSearchQuery(student.nombre);
        setShowStudentResults(false);
        setStudentRol('Semillerista');
    };

    const handleAddTeacher = (selectedTeacher: any | null) => {
        if (!selectedTeacher) return;

        if (selectedTeacher.cedula === formData.id_profesor_coordinador) {
            alert("No se puede agregar al Coordinador Responsable como integrante docente.");
            return;
        }

        if (groupMembers.some(m => m.cedula?.trim() === selectedTeacher.cedula?.trim())) {
            alert("Este docente ya es integrante de la propuesta de grupo.");
            return;
        }

        const newMember: GroupMember = {
            id_grupo_miembro: Date.now(),
            id_usuario: 0,
            cedula: selectedTeacher.cedula,
            nombre_completo: selectedTeacher.nombre,
            rol: teacherRol,
            activo: true,
            carrera: selectedTeacher.carrera,
            telefono_contacto: teacherPhone
        };

        const updatedMembers = [...groupMembers, newMember];
        setGroupMembers(updatedMembers);
        const updatedCarreras = recalculateCarreras(selectedCoordCareer, updatedMembers);
        setFormData(prev => ({ ...prev, carreras_ids: updatedCarreras }));

        setSelectedTeacher(null);
        setTeacherSearchQuery('');
        setTeacherPhone('');
        setTeacherRol('Co-Investigador');
    };

    const handleAddStudent = (selectedStudent: any | null) => {
        if (!selectedStudent) return;

        if (groupMembers.some(m => m.cedula?.trim() === selectedStudent.cedula?.trim())) {
            alert("Este estudiante ya es integrante de la propuesta de grupo.");
            return;
        }

        const newMember: GroupMember = {
            id_grupo_miembro: Date.now(),
            id_usuario: 0,
            cedula: selectedStudent.cedula,
            nombre_completo: selectedStudent.nombre,
            rol: studentRol,
            activo: true,
            carrera: selectedStudent.carrera,
            telefono_contacto: studentPhone
        };

        const updatedMembers = [...groupMembers, newMember];
        setGroupMembers(updatedMembers);
        const updatedCarreras = recalculateCarreras(selectedCoordCareer, updatedMembers);
        setFormData(prev => ({ ...prev, carreras_ids: updatedCarreras }));

        setSelectedStudent(null);
        setStudentSearchQuery('');
        setStudentPhone('');
        setStudentRol('Semillerista');
    };

    const handleRemoveMember = (idGrupoMiembro: number) => {
        const updatedMembers = groupMembers.filter(m => m.id_grupo_miembro !== idGrupoMiembro);
        setGroupMembers(updatedMembers);
        const updatedCarreras = recalculateCarreras(selectedCoordCareer, updatedMembers);
        setFormData(prev => ({ ...prev, carreras_ids: updatedCarreras }));
    };

    return {
        groupMembers,
        setGroupMembers,
        teacherPhone,
        setTeacherPhone,
        studentPhone,
        setStudentPhone,
        teacherRol,
        setTeacherRol,
        studentRol,
        setStudentRol,
        handleSelectCoordinator,
        handleSelectTeacher,
        handleSelectStudent,
        handleAddTeacher,
        handleAddStudent,
        handleRemoveMember
    };
}
