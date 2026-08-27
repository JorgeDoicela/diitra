import { useState, useEffect } from 'react';
import api from '../../../../../api/axios_config';

const mapUserDtoToGroupMember = (u: any) => ({
    cedula: u.id_profesor || u.id_sigafi || '',
    nombre: u.nombre_completo || u.nombre || '',
    email: u.email || u.email_institucional || '',
    carrera: u.carrera || '',
    telefono: '',
    nivelAcademico: 'Tercer Nivel',
    horasDisponibles: u.horas_investigacion || 0,
    horasAsignadas: u.horas_asignadas || 0,
    id_usuario: u.id_usuario || 0,
    tipo: u.type === 'ESTUDIANTE' ? 'alumno' : 'profesor'
});

export function useUserSearch() {
    // Coordinador
    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    // Docente
    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isTeacherSearching, setIsTeacherSearching] = useState(false);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

    // Estudiante
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [isStudentSearching, setIsStudentSearching] = useState(false);
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

    // Search debounces
    useEffect(() => {
        if (!showCoordResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const res = await api.get(`/Admin/users?type=DOCENTE&soloConHoras=true&search=${encodeURIComponent(coordSearchQuery.trim())}&pageSize=30`);
                const items = res.data?.items || [];
                setCoordSearchResults(items.map(mapUserDtoToGroupMember));
            } catch (err) {
                console.error("Error al buscar docentes coordinadores:", err);
            } finally {
                setIsCoordSearching(false);
            }
        }, coordSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [coordSearchQuery, showCoordResults]);

    useEffect(() => {
        if (!showTeacherResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsTeacherSearching(true);
            try {
                const res = await api.get(`/Admin/users?type=DOCENTE&soloConHoras=true&search=${encodeURIComponent(teacherSearchQuery.trim())}&pageSize=30`);
                const items = res.data?.items || [];
                setTeacherSearchResults(items.map(mapUserDtoToGroupMember));
            } catch (err) {
                console.error("Error al buscar docentes investigadores:", err);
            } finally {
                setIsTeacherSearching(false);
            }
        }, teacherSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [teacherSearchQuery, showTeacherResults]);

    useEffect(() => {
        if (!showStudentResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsStudentSearching(true);
            try {
                const res = await api.get(`/Admin/users?type=ESTUDIANTE&origenEstudiante=INSTITUTO&estadoEstudiante=ACTIVO&search=${encodeURIComponent(studentSearchQuery.trim())}&pageSize=30`);
                const items = res.data?.items || [];
                setStudentSearchResults(items.map(mapUserDtoToGroupMember));
            } catch (err) {
                console.error("Error al buscar estudiantes:", err);
            } finally {
                setIsStudentSearching(false);
            }
        }, studentSearchQuery.trim() ? 300 : 0);
        return () => clearTimeout(delayDebounceFn);
    }, [studentSearchQuery, showStudentResults]);

    return {
        // Coordinador
        coordSearchQuery,
        setCoordSearchQuery,
        coordSearchResults,
        isCoordSearching,
        showCoordResults,
        setShowCoordResults,

        // Docente
        teacherSearchQuery,
        setTeacherSearchQuery,
        teacherSearchResults,
        isTeacherSearching,
        showTeacherResults,
        setShowTeacherResults,
        selectedTeacher,
        setSelectedTeacher,

        // Estudiante
        studentSearchQuery,
        setStudentSearchQuery,
        studentSearchResults,
        isStudentSearching,
        showStudentResults,
        setShowStudentResults,
        selectedStudent,
        setSelectedStudent
    };
}
