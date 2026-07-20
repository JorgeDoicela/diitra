import { useState, useEffect } from 'react';
import api from '../../../../../api/axios_config';
import type { Group, GroupMember, Career } from '../useGroupDetail';

interface UseGroupMemberSearchProps {
    detailGroup: Group | null;
    detailMembers: GroupMember[];
    carreras: Career[];
    setEditFormData: React.Dispatch<React.SetStateAction<any>>;
    setSelectedCoordName: (name: string) => void;
    refreshGroupDetail: () => Promise<void>;
}

export const useGroupMemberSearch = ({
    detailGroup,
    detailMembers,
    carreras,
    setEditFormData,
    setSelectedCoordName,
    refreshGroupDetail
}: UseGroupMemberSearchProps) => {
    // Search and auto-completes: Coordinator
    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    // Search and auto-completes: Teachers
    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherPhone, setTeacherPhone] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isTeacherSearching, setIsTeacherSearching] = useState(false);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [teacherRol, setTeacherRol] = useState('Co-Investigador');

    // Search and auto-completes: Students
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [isStudentSearching, setIsStudentSearching] = useState(false);
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
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

    // Auto-search coord
    useEffect(() => {
        if (!showCoordResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const queryParam = (!coordSearchQuery.trim() || coordSearchQuery === (detailGroup?.nombre_coordinador || ''))
                    ? ''
                    : coordSearchQuery;
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(queryParam)}&tipo=profesor`);
                setCoordSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar docentes coordinadores:", err);
            } finally {
                setIsCoordSearching(false);
            }
        }, coordSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [coordSearchQuery, showCoordResults, detailGroup]);

    // Auto-search teachers
    useEffect(() => {
        if (!showTeacherResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsTeacherSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(teacherSearchQuery)}&tipo=profesor`);
                setTeacherSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar docentes investigadores:", err);
            } finally {
                setIsTeacherSearching(false);
            }
        }, teacherSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [teacherSearchQuery, showTeacherResults]);

    // Auto-search students
    useEffect(() => {
        if (!showStudentResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsStudentSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(studentSearchQuery)}&tipo=alumno`);
                setStudentSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar estudiantes:", err);
            } finally {
                setIsStudentSearching(false);
            }
        }, studentSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [studentSearchQuery, showStudentResults]);

    const handleSelectCoordinator = (teacher: any, currentEditIdProfesorCoord?: string) => {
        if (detailMembers.some(m => m.cedula === teacher.cedula)) {
            alert("Este docente ya es un integrante del grupo y no puede ser asignado como Coordinador Responsable.");
            return;
        }
        
        const updatedCarreras = recalculateCarreras(teacher.carrera || '', detailMembers);
        setEditFormData((prev: any) => ({
            ...prev,
            id_profesor_coordinador: teacher.cedula,
            carreras_ids: updatedCarreras
        }));

        setSelectedCoordName(teacher.nombre);
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

    const handleAddTeacher = async (currentIdProfesorCoord: string) => {
        if (!selectedTeacher || !detailGroup) return;

        if (selectedTeacher.cedula === currentIdProfesorCoord) {
            alert("No se puede agregar al Coordinador Responsable como integrante docente.");
            return;
        }

        if (detailMembers.some(m => m.cedula?.trim() === selectedTeacher.cedula?.trim())) {
            alert("Este docente ya es integrante de la propuesta de grupo.");
            return;
        }

        try {
            const memberDto = {
                id_usuario: 0,
                cedula: selectedTeacher.cedula,
                nombre_completo: selectedTeacher.nombre,
                rol: teacherRol,
                activo: true,
                telefono_contacto: teacherPhone
            };
            await api.post(`/Groups/${detailGroup.uuid}/members`, memberDto);
            await refreshGroupDetail();
            
            setSelectedTeacher(null);
            setTeacherSearchQuery('');
            setTeacherRol('Co-Investigador');
            setTeacherPhone('');
        } catch (err: any) {
            console.error("Error al agregar integrante docente:", err);
            alert("No se pudo agregar al docente: " + (err.response?.data?.message || err.message));
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudent || !detailGroup) return;

        if (detailMembers.some(m => m.cedula?.trim() === selectedStudent.cedula?.trim())) {
            alert("Este estudiante ya es integrante de la propuesta de grupo.");
            return;
        }

        try {
            const memberDto = {
                id_usuario: 0,
                cedula: selectedStudent.cedula,
                nombre_completo: selectedStudent.nombre,
                rol: studentRol,
                activo: true,
                telefono_contacto: studentPhone
            };
            await api.post(`/Groups/${detailGroup.uuid}/members`, memberDto);
            await refreshGroupDetail();
            
            setSelectedStudent(null);
            setStudentSearchQuery('');
            setStudentPhone('');
            setStudentRol('Semillerista');
        } catch (err: any) {
            console.error("Error al agregar estudiante:", err);
            alert("No se pudo agregar al estudiante: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRemoveMember = async (idGrupoMiembro: number) => {
        const reason = window.prompt("Ingrese el motivo por el cual el integrante se retira del grupo (opcional):");
        if (reason === null) return;

        try {
            const encodedReason = encodeURIComponent(reason.trim());
            await api.delete(`/Groups/members/${idGrupoMiembro}?reason=${encodedReason}`);
            await refreshGroupDetail();
        } catch (error: any) {
            console.error("Error al retirar integrante:", error);
            alert("No se pudo retirar al integrante: " + (error.response?.data?.message || error.message));
        }
    };

    return {
        coordSearchQuery,
        setCoordSearchQuery,
        coordSearchResults,
        isCoordSearching,
        showCoordResults,
        setShowCoordResults,
        teacherSearchQuery,
        setTeacherSearchQuery,
        teacherPhone,
        setTeacherPhone,
        studentPhone,
        setStudentPhone,
        teacherSearchResults,
        isTeacherSearching,
        showTeacherResults,
        setShowTeacherResults,
        selectedTeacher,
        setSelectedTeacher,
        teacherRol,
        setTeacherRol,
        studentSearchQuery,
        setStudentSearchQuery,
        studentSearchResults,
        isStudentSearching,
        showStudentResults,
        setShowStudentResults,
        selectedStudent,
        setSelectedStudent,
        studentRol,
        setStudentRol,
        handleSelectCoordinator,
        handleSelectTeacher,
        handleSelectStudent,
        handleAddTeacher,
        handleAddStudent,
        handleRemoveMember
    };
};
