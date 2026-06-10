import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Search, CheckCircle, GraduationCap, User, UserMinus, Shield, Award, Calendar, FileText, ChevronRight, BookOpen, Eye
} from 'lucide-react';
import api from '../../../api/axios_config';

interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    carrera?: string;
}

interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    carrera_coordinador?: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    categoria_consolidacion?: string;
    activo: boolean;
    estado?: string;
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
}

interface ResearchLine {
    id: number;
    nombre: string;
}

interface Domain {
    id_dominio: number;
    nombre: string;
}

interface Career {
    id_carrera: number;
    carrera1: string;
}

interface GroupFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    editingGroup: Group | null;
    isReadOnly: boolean;
    isAdmin: boolean;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    fetchData: () => void;
    setConfirmDialog: React.Dispatch<React.SetStateAction<any>>;
    formatUserDetails: (u: any) => string;
    formatCareerName: (name: string) => string;
    setIsCareerModalOpen: (open: boolean) => void;
    onDraftCleared?: () => void;
}

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const GroupFormDrawer: React.FC<GroupFormDrawerProps> = ({
    isOpen,
    onClose,
    editingGroup,
    isReadOnly,
    isAdmin,
    dominios,
    carreras,
    lines,
    fetchData,
    setConfirmDialog,
    formatUserDetails,
    formatCareerName,
    setIsCareerModalOpen,
    onDraftCleared
}) => {
    // Form states
    const [formData, setFormData] = useState({
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
        carreras_ids: [] as number[]
    });

    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const isInitializedRef = useRef(false);

    // Search and auto-completes
    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [selectedCoordName, setSelectedCoordName] = useState('');
    const [selectedCoordCareer, setSelectedCoordCareer] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isTeacherSearching, setIsTeacherSearching] = useState(false);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [teacherRol, setTeacherRol] = useState('Co-Investigador');

    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [isStudentSearching, setIsStudentSearching] = useState(false);
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [studentRol, setStudentRol] = useState('Semillerista');

    // Populate data when editingGroup changes
    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
            return;
        }

        if (editingGroup) {
            const draftKey = `edit_group_form_draft_${editingGroup.uuid}`;
            const draft = localStorage.getItem(draftKey);
            if (draft && !isReadOnly) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                        const validatedFormData = {
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
                            carreras_ids: Array.isArray(parsed.formData.carreras_ids) ? parsed.formData.carreras_ids : []
                        };
                        setFormData(validatedFormData);
                        setSelectedCoordName(parsed.selectedCoordName || '');
                        setSelectedCoordCareer(parsed.selectedCoordCareer || '');
                        setGroupMembers(Array.isArray(parsed.groupMembers) ? parsed.groupMembers : []);
                        setCoordSearchQuery('');
                        setIsDraftRestored(true);
                        isInitializedRef.current = true;
                        return;
                    } else {
                        throw new Error("Estructura de borrador de grupo inválida");
                    }
                } catch (e) {
                    console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                    localStorage.removeItem(draftKey);
                    localStorage.removeItem('groups_draft_metadata');
                }
            }

            setFormData({
                nombre: editingGroup.nombre || '',
                siglas: editingGroup.siglas || '',
                tipo_grupo: editingGroup.tipo_grupo || 'Investigación',
                id_dominio: editingGroup.id_dominio ? editingGroup.id_dominio.toString() : '',
                id_profesor_coordinador: editingGroup.id_profesor_coordinador || '',
                objetivo_general: editingGroup.objetivo_general || '',
                mision: editingGroup.mision || '',
                vision: editingGroup.vision || '',
                resolucion_aprobacion: editingGroup.resolucion_aprobacion || '',
                fecha_creacion: editingGroup.fecha_creacion ? editingGroup.fecha_creacion.split('T')[0] : '',
                categoria_consolidacion: editingGroup.categoria_consolidacion || 'En Formación',
                lineas_ids: editingGroup.lineas_ids || [],
                carreras_ids: editingGroup.carreras_ids || []
            });
            setSelectedCoordName(editingGroup.nombre_coordinador || '');
            setSelectedCoordCareer(editingGroup.carrera_coordinador || '');
            setCoordSearchQuery('');

            if (editingGroup.miembros) {
                const activeMembers = editingGroup.miembros.filter((m: any) => m.activo);
                setGroupMembers(activeMembers);
            } else {
                setGroupMembers([]);
            }
        } else {
            const draftKey = 'new_group_form_draft';
            const draft = localStorage.getItem(draftKey);
            if (draft && !isReadOnly) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed && typeof parsed === 'object' && parsed.formData && typeof parsed.formData === 'object') {
                        const validatedFormData = {
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
                            carreras_ids: Array.isArray(parsed.formData.carreras_ids) ? parsed.formData.carreras_ids : []
                        };
                        setFormData(validatedFormData);
                        setSelectedCoordName(parsed.selectedCoordName || '');
                        setSelectedCoordCareer(parsed.selectedCoordCareer || '');
                        setGroupMembers(Array.isArray(parsed.groupMembers) ? parsed.groupMembers : []);
                        setCoordSearchQuery('');
                        setIsDraftRestored(true);
                        isInitializedRef.current = true;
                        return;
                    } else {
                        throw new Error("Estructura de borrador de grupo nuevo inválida");
                    }
                } catch (e) {
                    console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                    localStorage.removeItem(draftKey);
                    localStorage.removeItem('groups_draft_metadata');
                }
            }

            setFormData({
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
                carreras_ids: []
            });
            setSelectedCoordName('');
            setSelectedCoordCareer('');
            setCoordSearchQuery('');
            setGroupMembers([]);
        }
        setIsDraftRestored(false);
        isInitializedRef.current = true;
    }, [editingGroup, isOpen, isReadOnly]);

    // debounces
    useEffect(() => {
        if (!showCoordResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const queryParam = (!coordSearchQuery.trim() || coordSearchQuery === (editingGroup?.nombre_coordinador || ''))
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
    }, [coordSearchQuery, showCoordResults, editingGroup]);

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

    const handleSelectCoordinator = (teacher: any) => {
        if (groupMembers.some(m => m.cedula === teacher.cedula)) {
            alert("Este docente ya es un integrante del grupo y no puede ser asignado como Coordinador Responsable.");
            return;
        }
        
        if (teacher.carrera) {
            const teacherCareers = teacher.carrera.split(',').map((c: string) => c.trim().toUpperCase());
            const matchedIds = carreras
                .filter(c => teacherCareers.includes(c.carrera1.trim().toUpperCase()))
                .map(c => c.id_carrera);

            if (matchedIds.length > 0) {
                setFormData(prev => {
                    const newIds = new Set([...prev.carreras_ids, ...matchedIds]);
                    return {
                        ...prev,
                        id_profesor_coordinador: teacher.cedula,
                        carreras_ids: Array.from(newIds)
                    };
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    id_profesor_coordinador: teacher.cedula
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                id_profesor_coordinador: teacher.cedula
            }));
        }

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

    const handleAddTeacher = async () => {
        if (!selectedTeacher) return;

        if (selectedTeacher.cedula === formData.id_profesor_coordinador) {
            alert("No se puede agregar al Coordinador Responsable como integrante docente.");
            return;
        }

        const newMember = {
            id_grupo_miembro: Date.now(),
            id_usuario: 0,
            cedula: selectedTeacher.cedula,
            nombre_completo: selectedTeacher.nombre,
            rol: teacherRol,
            activo: true,
            carrera: selectedTeacher.carrera
        };

        if (editingGroup) {
            try {
                const memberDto = {
                    id_usuario: 0,
                    cedula: selectedTeacher.cedula,
                    nombre_completo: selectedTeacher.nombre,
                    rol: teacherRol,
                    activo: true
                };
                await api.post(`/Groups/${editingGroup.uuid}/members`, memberDto);
                const res = await api.get(`/Groups/${editingGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup && fullGroup.miembros) {
                    const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                    setGroupMembers(activeMembers);
                }
            } catch (error: any) {
                console.error("Error al agregar integrante docente:", error);
                alert("No se pudo agregar al docente: " + (error.response?.data?.message || error.message));
            }
        } else {
            if (groupMembers.some(m => m.cedula === selectedTeacher.cedula)) {
                alert("Este docente ya ha sido agregado al grupo.");
                return;
            }
            setGroupMembers(prev => [...prev, newMember as any]);
        }

        if (selectedTeacher.carrera) {
            const teacherCareers = selectedTeacher.carrera.split(',').map((c: string) => c.trim().toUpperCase());
            const matchedIds = carreras
                .filter(c => teacherCareers.includes(c.carrera1.trim().toUpperCase()))
                .map(c => c.id_carrera);

            if (matchedIds.length > 0) {
                setFormData(prev => {
                    const newIds = new Set([...prev.carreras_ids, ...matchedIds]);
                    return { ...prev, carreras_ids: Array.from(newIds) };
                });
            }
        }

        setSelectedTeacher(null);
        setTeacherSearchQuery('');
        setTeacherRol('Co-Investigador');
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;

        const newMember = {
            id_grupo_miembro: Date.now(),
            id_usuario: 0,
            cedula: selectedStudent.cedula,
            nombre_completo: selectedStudent.nombre,
            rol: studentRol,
            activo: true,
            carrera: selectedStudent.carrera
        };

        if (editingGroup) {
            try {
                const memberDto = {
                    id_usuario: 0,
                    cedula: selectedStudent.cedula,
                    nombre_completo: selectedStudent.nombre,
                    rol: studentRol,
                    activo: true
                };
                await api.post(`/Groups/${editingGroup.uuid}/members`, memberDto);
                const res = await api.get(`/Groups/${editingGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup && fullGroup.miembros) {
                    const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                    setGroupMembers(activeMembers);
                }
            } catch (error: any) {
                console.error("Error al agregar integrante estudiante:", error);
                alert("No se pudo agregar al estudiante: " + (error.response?.data?.message || error.message));
            }
        } else {
            if (groupMembers.some(m => m.cedula === selectedStudent.cedula)) {
                alert("Este estudiante ya ha sido agregado al grupo.");
                return;
            }
            setGroupMembers(prev => [...prev, newMember as any]);
        }

        setSelectedStudent(null);
        setStudentSearchQuery('');
        setStudentRol('Semillerista');
    };

    const handleRemoveMember = async (idGrupoMiembro: number) => {
        if (editingGroup) {
            const reason = window.prompt("Ingrese el motivo por el cual el integrante se retira del grupo (opcional):");
            if (reason === null) return;

            try {
                const encodedReason = encodeURIComponent(reason.trim());
                await api.delete(`/Groups/members/${idGrupoMiembro}?reason=${encodedReason}`);
                const res = await api.get(`/Groups/${editingGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup && fullGroup.miembros) {
                    const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                    setGroupMembers(activeMembers);
                }
            } catch (error: any) {
                console.error("Error al retirar integrante:", error);
                alert("No se pudo retirar al integrante: " + (error.response?.data?.message || error.message));
            }
        } else {
            setGroupMembers(prev => prev.filter(m => m.id_grupo_miembro !== idGrupoMiembro));
        }
    };

    const clearDraft = () => {
        localStorage.removeItem('new_group_form_draft');
        localStorage.removeItem('groups_draft_metadata');
        if (editingGroup) {
            localStorage.removeItem(`edit_group_form_draft_${editingGroup.uuid}`);
        }
        if (onDraftCleared) {
            onDraftCleared();
        }
    };

    // Auto-save draft on state changes
    useEffect(() => {
        if (!isOpen || isReadOnly || !isInitializedRef.current) return;

        const draftData = {
            formData,
            selectedCoordName,
            selectedCoordCareer,
            groupMembers
        };

        if (editingGroup) {
            const draftKey = `edit_group_form_draft_${editingGroup.uuid}`;
            localStorage.setItem(draftKey, JSON.stringify(draftData));
            
            const meta = {
                type: 'edit',
                uuid: editingGroup.uuid,
                groupName: formData.nombre || editingGroup.nombre || 'Borrador sin nombre',
                timestamp: Date.now()
            };
            localStorage.setItem('groups_draft_metadata', JSON.stringify(meta));
        } else {
            localStorage.setItem('new_group_form_draft', JSON.stringify(draftData));
            
            const meta = {
                type: 'new',
                groupName: formData.nombre || 'Borrador de Nueva Propuesta',
                timestamp: Date.now()
            };
            localStorage.setItem('groups_draft_metadata', JSON.stringify(meta));
        }
    }, [formData, selectedCoordName, selectedCoordCareer, groupMembers, isOpen, isReadOnly, editingGroup]);

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) {
            onClose();
            return;
        }
        try {
            const payload = {
                ...formData,
                id_profesor_coordinador: formData.id_profesor_coordinador || null,
                id_dominio: formData.id_dominio ? parseInt(formData.id_dominio) : null,
                miembros: editingGroup ? [] : groupMembers.map(m => ({
                    id_usuario: m.id_usuario || 0,
                    cedula: m.cedula,
                    nombre_completo: m.nombre_completo,
                    rol: m.rol,
                    activo: true
                }))
            };

            if (editingGroup) {
                await api.put(`/Groups/${editingGroup.uuid}`, payload);
            } else {
                await api.post('/Groups', payload);
            }
            clearDraft();
            onClose();
            fetchData();
        } catch (error: any) {
            console.error('Error saving group:', error);
            const detail = error.response?.data?.detail || error.response?.data?.message || '';
            alert(`Error al guardar el grupo: ${error.message}${detail ? `\n\nDetalle: ${detail}` : ''}`);
        }
    };

    const toggleLine = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id)
                ? prev.lineas_ids.filter(lineId => lineId !== id)
                : [...prev.lineas_ids, id]
        }));
    };

    const handleCloseModal = () => {
        if (isReadOnly) {
            onClose();
            return;
        }

        let hasChanges = false;
        if (editingGroup) {
            hasChanges = 
                formData.nombre !== editingGroup.nombre ||
                formData.siglas !== editingGroup.siglas ||
                formData.tipo_grupo !== editingGroup.tipo_grupo ||
                formData.id_dominio !== (editingGroup.id_dominio?.toString() ?? '') ||
                formData.id_profesor_coordinador !== (editingGroup.id_profesor_coordinador ?? '') ||
                formData.objetivo_general !== editingGroup.objetivo_general ||
                formData.mision !== editingGroup.mision ||
                formData.vision !== editingGroup.vision ||
                formData.categoria_consolidacion !== (editingGroup.categoria_consolidacion ?? 'En Formación') ||
                JSON.stringify(formData.lineas_ids.slice().sort()) !== JSON.stringify((editingGroup.lineas_ids || []).slice().sort());
        } else {
            hasChanges = 
                formData.nombre.trim() !== '' ||
                formData.siglas.trim() !== '' ||
                formData.objetivo_general.trim() !== '' ||
                formData.mision.trim() !== '' ||
                formData.vision.trim() !== '' ||
                groupMembers.length > 0;
        }

        if (hasChanges) {
            setConfirmDialog({
                isOpen: true,
                title: 'Cambios no guardados',
                message: '¿Está seguro de salir? Perderá todos los datos que ha ingresado en este formulario.',
                type: 'warning',
                onConfirm: () => {
                    clearDraft();
                    onClose();
                    setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            clearDraft();
            onClose();
        }
    };

    if (!isOpen) return null;

    const teachers = groupMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return !rolLower.includes('semillerista') && !rolLower.includes('estudiante');
    });

    const students = groupMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return rolLower.includes('semillerista') || rolLower.includes('estudiante');
    });

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleCloseModal}
            />
            <div className="relative w-full max-w-3xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-main tracking-tight">
                                {isReadOnly ? 'Ver Grupo de Investigación' : (editingGroup ? 'Editar Grupo de Investigación' : 'Nuevo Grupo de Investigación')}
                            </h3>
                            <p className="section-label text-text-dim">Configuración administrativa y normativa</p>
                        </div>
                    </div>
                    <button onClick={handleCloseModal} className="text-text-dim hover:text-text-main transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                    {isDraftRestored && (
                        <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (editingGroup) {
                                        setFormData({
                                            nombre: editingGroup.nombre || '',
                                            siglas: editingGroup.siglas || '',
                                            tipo_grupo: editingGroup.tipo_grupo || 'Investigación',
                                            id_dominio: editingGroup.id_dominio ? editingGroup.id_dominio.toString() : '',
                                            id_profesor_coordinador: editingGroup.id_profesor_coordinador || '',
                                            objetivo_general: editingGroup.objetivo_general || '',
                                            mision: editingGroup.mision || '',
                                            vision: editingGroup.vision || '',
                                            resolucion_aprobacion: editingGroup.resolucion_aprobacion || '',
                                            fecha_creacion: editingGroup.fecha_creacion ? editingGroup.fecha_creacion.split('T')[0] : '',
                                            categoria_consolidacion: editingGroup.categoria_consolidacion || 'En Formación',
                                            lineas_ids: editingGroup.lineas_ids || [],
                                            carreras_ids: editingGroup.carreras_ids || []
                                        });
                                        setSelectedCoordName(editingGroup.nombre_coordinador || '');
                                        setSelectedCoordCareer(editingGroup.carrera_coordinador || '');
                                        if (editingGroup.miembros) {
                                            const activeMembers = editingGroup.miembros.filter((m: any) => m.activo);
                                            setGroupMembers(activeMembers);
                                        } else {
                                            setGroupMembers([]);
                                        }
                                    } else {
                                        setFormData({
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
                                            carreras_ids: []
                                        });
                                        setSelectedCoordName('');
                                        setSelectedCoordCareer('');
                                        setGroupMembers([]);
                                    }
                                    localStorage.removeItem('new_group_form_draft');
                                    localStorage.removeItem('groups_draft_metadata');
                                    if (editingGroup) {
                                        localStorage.removeItem(`edit_group_form_draft_${editingGroup.uuid}`);
                                    }
                                    setIsDraftRestored(false);
                                    if (onDraftCleared) {
                                        onDraftCleared();
                                    }
                                }}
                                className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                            >
                                Revertir al original
                            </button>
                        </div>
                    )}
                    {!isAdmin && !isReadOnly && (
                        <div className="space-y-3 animate-fade-up">
                            <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex items-center gap-3">
                                <Shield size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    Las propuestas se envían en estado <span className="text-text-main font-semibold">Pendiente</span> para su revisión y requieren aprobación formal del administrador antes de su activación.
                                </p>
                            </div>
                            {editingGroup && editingGroup.estado === 'Aprobado' && (
                                <div className="border border-warning/20 bg-warning-subtle rounded-lg p-3 flex items-center gap-3">
                                    <Calendar size={16} className="text-warning shrink-0" />
                                    <p className="text-xs text-text-dim">
                                        Este grupo ya está <span className="text-warning font-semibold">Aprobado</span>. Cualquier modificación sustancial revertirá el estado a Pendiente y requerirá una nueva evaluación.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Basic Settings */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Grupo</label>
                            <input
                                type="text"
                                required
                                disabled={isReadOnly}
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                placeholder="Ej: Grupo de Investigación en Sistemas Inteligentes"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Siglas / Acrónimo</label>
                            <input
                                type="text"
                                required
                                disabled={isReadOnly}
                                value={formData.siglas}
                                onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase font-semibold"
                                placeholder="Ej: GISI"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tipo de Grupo</label>
                            <select
                                disabled={isReadOnly}
                                value={formData.tipo_grupo}
                                onChange={(e) => setFormData({ ...formData, tipo_grupo: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                            >
                                <option value="Investigación">Grupo de Investigación</option>
                                <option value="Semillero">Semillero de Investigación</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dominio Académico</label>
                            <select
                                required
                                disabled={isReadOnly}
                                value={formData.id_dominio}
                                onChange={(e) => setFormData({ ...formData, id_dominio: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                            >
                                <option value="">Seleccione Dominio...</option>
                                {dominios.map(d => (
                                    <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Etapa del grupo</label>
                            <select
                                disabled={isReadOnly}
                                value={formData.categoria_consolidacion}
                                onChange={(e) => setFormData({ ...formData, categoria_consolidacion: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                            >
                                <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                                <option value="Consolidado">Consolidado (Trayectoria Probada)</option>
                            </select>
                        </div>

                        {/* Responsible Coordinator (Docente principal) */}
                        <div className="space-y-2 md:col-span-2 relative">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <User size={12} /> Coordinador Responsable
                            </label>

                            {!isReadOnly ? (
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                    <input
                                        type="text"
                                        value={coordSearchQuery || selectedCoordName}
                                        onChange={(e) => {
                                            setCoordSearchQuery(e.target.value);
                                            if (selectedCoordName) {
                                                setSelectedCoordName('');
                                                setSelectedCoordCareer('');
                                                setFormData({ ...formData, id_profesor_coordinador: '' });
                                            }
                                        }}
                                        onFocus={() => setShowCoordResults(true)}
                                        placeholder="Escriba para buscar y seleccionar Coordinador Responsable (Cédula o Nombre)..."
                                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 pl-10 text-sm text-text-main focus:outline-none transition-all placeholder:text-text-dim/60 uppercase font-medium"
                                    />
                                    {isCoordSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-text-main rounded-full"></div>
                                        </div>
                                    )}

                                    {showCoordResults && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-56 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                {isCoordSearching && coordSearchResults.length === 0 ? (
                                                    <div className="p-5 text-center text-xs text-text-dim font-mono">
                                                        <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-text-main rounded-full mx-auto mb-2"></div>
                                                        <span>Buscando docentes...</span>
                                                    </div>
                                                ) : coordSearchResults.length === 0 && !isCoordSearching ? (
                                                    <div className="p-5 text-center text-xs text-text-dim font-mono uppercase">
                                                        No se encontraron docentes.
                                                    </div>
                                                ) : (
                                                    coordSearchResults.map((selectedUser: any) => (
                                                        <button
                                                            key={selectedUser.cedula}
                                                            type="button"
                                                            onClick={() => {
                                                                handleSelectCoordinator(selectedUser);
                                                                setShowCoordResults(false);
                                                            }}
                                                            className="w-full p-3 flex items-center justify-between hover:bg-surface-hover text-left transition-colors"
                                                        >
                                                            <div className="space-y-1 truncate pr-2">
                                                                <p className="font-bold text-text-main text-xs truncate flex items-center gap-2">
                                                                    <span>{formatNombre(selectedUser.nombre)}</span>
                                                                    {selectedUser.horas_disponibles !== undefined && (
                                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                                                            (selectedUser.horas_disponibles - (selectedUser.horas_asignadas || 0)) > 0 
                                                                                ? 'bg-success/15 text-success border border-success/30' 
                                                                                : 'bg-error/15 text-error border border-error/30'
                                                                        }`}>
                                                                            Disp: {selectedUser.horas_disponibles - (selectedUser.horas_asignadas || 0)}h / {selectedUser.horas_disponibles}h
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-text-dim font-mono text-[9px]">{formatUserDetails(selectedUser)}</p>
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded text-[8px] shrink-0 font-extrabold tracking-wider uppercase border bg-text-main/10 border-text-main/20 text-text-main">
                                                                Docente
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-bg-deep border border-border-thin rounded-xl flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-text-main/10 border border-text-main/20 flex items-center justify-center text-text-main shrink-0">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-text-main tracking-wider">{selectedCoordName ? formatNombre(selectedCoordName) : 'S/D'}</h4>
                                        <p className="text-[10px] text-text-dim font-mono uppercase tracking-tight">
                                            C.I. {formData.id_profesor_coordinador || 'S/D'} {selectedCoordCareer ? ` | ${formatCareerName(selectedCoordCareer)}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Bento Section: Group Members */}
                    <section className="p-6 bg-surface rounded-2xl border border-border-thin space-y-6 animate-fade-up">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-thin">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest">
                                    <Users size={12} />
                                    <span>Integrantes del Grupo de Investigación</span>
                                </div>
                                <p className="text-[10px] text-text-dim uppercase font-bold">Docentes con horas vigentes y Estudiantes matriculados</p>
                            </div>
                            <span className="text-[9px] font-bold text-text-main bg-text-main/10 border border-text-main/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                {groupMembers.length} Miembros Activos
                            </span>
                        </div>

                        {/* Grid separating Docentes and Estudiantes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sector 1: Docentes Investigadores */}
                            <div className="space-y-4 p-5 rounded-2xl bg-bg-deep/20 border border-emerald-500/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-emerald-500/25">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                
                                <div className="flex justify-between items-center pb-2 border-b border-border-thin">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Docentes Investigadores</h4>
                                            <p className="text-[10px] text-text-dim/80 font-bold uppercase tracking-tight">Académicos con horas de investigación</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                                        {teachers.length} Activos
                                    </span>
                                </div>

                                {/* Form to add teacher */}
                                {!isReadOnly && (
                                    <div className="space-y-3 p-3.5 bg-bg-deep/40 rounded-xl border border-border-thin">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="relative space-y-1">
                                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Buscador Docente</label>
                                                <div className="relative">
                                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                    <input
                                                        type="text"
                                                        value={teacherSearchQuery}
                                                        onChange={(e) => {
                                                            setTeacherSearchQuery(e.target.value);
                                                            if (selectedTeacher) {
                                                                setSelectedTeacher(null);
                                                            }
                                                        }}
                                                        onFocus={() => setShowTeacherResults(true)}
                                                        placeholder="Buscar docente investigador por nombre o cédula..."
                                                        className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-2.5 pl-9 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                                    />
                                                    {isTeacherSearching && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-emerald-400 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedTeacher && (
                                                    <div className="mt-1.5 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] flex justify-between items-center font-mono text-emerald-400">
                                                        <span>Docente: {selectedTeacher.nombre}</span>
                                                        <span className="text-[7px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 uppercase font-bold tracking-widest">Seleccionado</span>
                                                    </div>
                                                )}

                                                {showTeacherResults && (
                                                    <>
                                                        <div className="fixed inset-0 z-20" onClick={() => setShowTeacherResults(false)}></div>
                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-40 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                            {teacherSearchResults.length === 0 ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    No se encontraron docentes con horas vigentes.
                                                                </div>
                                                            ) : (
                                                                teacherSearchResults.map((teacher: any) => (
                                                                    <button
                                                                        key={teacher.cedula}
                                                                        type="button"
                                                                        onClick={() => handleSelectTeacher(teacher)}
                                                                        className="w-full p-2.5 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                                    >
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-bold text-text-main text-xs flex items-center gap-2">
                                                                                <span>{formatNombre(teacher.nombre)}</span>
                                                                                {teacher.horas_disponibles !== undefined && (
                                                                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                                                                        (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                                            ? 'bg-success/15 text-success border border-success/30' 
                                                                                            : 'bg-error/15 text-error border border-error/30'
                                                                                    }`}>
                                                                                        Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                            <p className="text-text-dim font-mono text-[9px]">{formatUserDetails(teacher)}</p>
                                                                        </div>
                                                                        <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border bg-emerald-500/15 border-emerald-500/25 text-emerald-400">
                                                                            Docente
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-8 space-y-1">
                                                    <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                                    <select
                                                        value={teacherRol}
                                                        onChange={(e) => setTeacherRol(e.target.value)}
                                                        className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                                    >
                                                        <option value="Co-Investigador">Co-Investigador</option>
                                                        <option value="Director de Proyecto">Director de Proyecto</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddTeacher}
                                                        disabled={!selectedTeacher}
                                                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-bg-deep font-bold px-3 py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                        Vincular
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Teacher List */}
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {teachers.map((member) => (
                                        <div
                                            key={member.id_grupo_miembro}
                                            className="p-3 bg-bg-deep/40 rounded-xl border border-border-thin hover:border-emerald-500/20 hover:bg-bg-deep/60 transition-all flex justify-between items-center group/member"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                    <User size={14} />
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                    <p className="text-xs font-semibold text-text-main truncate max-w-[200px]" title={formatNombre(member.nombre_completo)}>
                                                        {formatNombre(member.nombre_completo)}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[8px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                            C.I. {member.cedula || 'S/D'}
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                            {member.rol}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                    className="p-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-dim hover:text-red-500 opacity-0 group-hover/member:opacity-100 focus:opacity-100 transition-all shrink-0"
                                                    title="Desvincular docente"
                                                >
                                                    <UserMinus size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {teachers.length === 0 && (
                                        <div className="py-6 text-center bg-bg-deep/20 rounded-xl border border-dashed border-border-thin/60 space-y-1.5">
                                            <Users size={16} className="mx-auto text-text-dim/30" />
                                            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Sin docentes investigadores</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sector 2: Estudiantes Semilleristas */}
                            <div className="space-y-4 p-5 rounded-2xl bg-bg-deep/20 border border-blue-500/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-blue-500/25">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                                <div className="flex justify-between items-center pb-2 border-b border-border-thin">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <GraduationCap size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Estudiantes Semilleristas</h4>
                                            <p className="text-[10px] text-text-dim/80 font-bold uppercase tracking-tight">Alumnos matriculados en semillero</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                                        {students.length} Activos
                                    </span>
                                </div>

                                {/* Form to add student */}
                                {!isReadOnly && (
                                    <div className="space-y-3 p-3.5 bg-bg-deep/40 rounded-xl border border-border-thin">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="relative space-y-1">
                                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Buscador Estudiante</label>
                                                <div className="relative">
                                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                    <input
                                                        type="text"
                                                        value={studentSearchQuery}
                                                        onChange={(e) => {
                                                            setStudentSearchQuery(e.target.value);
                                                            if (selectedStudent) {
                                                                setSelectedStudent(null);
                                                            }
                                                        }}
                                                        onFocus={() => setShowStudentResults(true)}
                                                        placeholder="Buscar estudiante por nombre o cédula..."
                                                        className="w-full bg-bg-deep border border-border-thin focus:border-blue-500 rounded-lg p-2.5 pl-9 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                                    />
                                                    {isStudentSearching && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-blue-400 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedStudent && (
                                                    <div className="mt-1.5 px-2.5 py-1 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[9px] flex justify-between items-center font-mono text-blue-400">
                                                        <span>Estudiante: {selectedStudent.nombre}</span>
                                                        <span className="text-[7px] bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20 uppercase font-bold tracking-widest">Seleccionado</span>
                                                    </div>
                                                )}

                                                {showStudentResults && (
                                                    <>
                                                        <div className="fixed inset-0 z-20" onClick={() => setShowStudentResults(false)}></div>
                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-40 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                            {studentSearchResults.length === 0 ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    No se encontraron estudiantes matriculados.
                                                                </div>
                                                            ) : (
                                                                studentSearchResults.map((student: any) => (
                                                                    <button
                                                                        key={student.cedula}
                                                                        type="button"
                                                                        onClick={() => handleSelectStudent(student)}
                                                                        className="w-full p-2.5 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                                    >
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-bold text-text-main text-xs">{formatNombre(student.nombre)}</p>
                                                                            <p className="text-text-dim font-mono text-[9px]">{formatUserDetails(student)}</p>
                                                                        </div>
                                                                        <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border bg-blue-500/15 border-blue-500/25 text-blue-400">
                                                                            Estudiante
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-8 space-y-1">
                                                    <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                                    <select
                                                        value={studentRol}
                                                        onChange={(e) => setStudentRol(e.target.value)}
                                                        className="w-full bg-bg-deep border border-border-thin focus:border-blue-500 rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                                    >
                                                        <option value="Semillerista">Semillerista</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddStudent}
                                                        disabled={!selectedStudent}
                                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-bg-deep font-bold px-3 py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                        Vincular
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Student List */}
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {students.map((member) => (
                                        <div
                                            key={member.id_grupo_miembro}
                                            className="p-3 bg-bg-deep/40 rounded-xl border border-border-thin hover:border-blue-500/20 hover:bg-bg-deep/60 transition-all flex justify-between items-center group/member"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                    <GraduationCap size={14} />
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                    <p className="text-xs font-semibold text-text-main truncate max-w-[200px]" title={formatNombre(member.nombre_completo)}>
                                                        {formatNombre(member.nombre_completo)}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[8px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                            C.I. {member.cedula || 'S/D'}
                                                        </span>
                                                        <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                            {member.rol}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                    className="p-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-dim hover:text-red-500 opacity-0 group-hover/member:opacity-100 focus:opacity-100 transition-all shrink-0"
                                                    title="Desvincular estudiante"
                                                >
                                                    <UserMinus size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="py-6 text-center bg-bg-deep/20 rounded-xl border border-dashed border-border-thin/60 space-y-1.5">
                                            <GraduationCap size={16} className="mx-auto text-text-dim/30" />
                                            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Sin estudiantes vinculados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Careers (Dynamic Auto-resolved) */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <GraduationCap size={12} /> Carreras / Programas Académicos (Automático)
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsCareerModalOpen(true)}
                                className="px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <Eye size={12} /> Ver Detalle de Vinculación
                            </button>
                        </div>
                        
                        {(() => {
                            const linkedCareers: string[] = [];
                            if (selectedCoordCareer) {
                                selectedCoordCareer.split(',').forEach(c => {
                                    const trimmed = c.trim();
                                    if (trimmed && !linkedCareers.includes(trimmed)) {
                                        linkedCareers.push(trimmed);
                                    }
                                });
                            }
                            groupMembers.forEach(m => {
                                if (m.carrera) {
                                    m.carrera.split(',').forEach(c => {
                                        const trimmed = c.trim();
                                        if (trimmed && !linkedCareers.includes(trimmed)) {
                                            linkedCareers.push(trimmed);
                                        }
                                    });
                                }
                            });

                            if (linkedCareers.length === 0) {
                                        return (
                                            <div className="p-4 bg-bg-deep/40 rounded-xl border border-dashed border-border-thin text-center space-y-1">
                                                <GraduationCap size={16} className="mx-auto text-text-dim/40" />
                                                <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">
                                                    Las carreras se vincularán automáticamente según el Coordinador y los Integrantes seleccionados.
                                                </p>
                                            </div>
                                        );
                            }

                            return (
                                <div className="flex flex-wrap gap-2 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                                    {linkedCareers.map((cName, idx) => (
                                        <span key={idx} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                                            {formatCareerName(cName)}
                                        </span>
                                    ))}
                                </div>
                            );
                        })()}
                    </section>

                    {/* Identity Statements */}
                    <section className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                            <textarea
                                rows={3}
                                disabled={isReadOnly}
                                value={formData.objetivo_general}
                                onChange={(e) => setFormData({ ...formData, objetivo_general: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Misión</label>
                                <textarea
                                    rows={3}
                                    disabled={isReadOnly}
                                    value={formData.mision}
                                    onChange={(e) => setFormData({ ...formData, mision: e.target.value })}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                                <textarea
                                    rows={3}
                                    disabled={isReadOnly}
                                    value={formData.vision}
                                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Research Lines */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={12} /> Líneas de Investigación Institucionales
                            </label>
                            <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {formData.lineas_ids.length} seleccionadas
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lines.map(line => (
                                <div
                                    key={line.id}
                                    onClick={() => !isReadOnly && toggleLine(line.id)}
                                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                        } ${formData.lineas_ids.includes(line.id)
                                            ? 'bg-text-main/10 border-text-main text-text-main'
                                            : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                        }`}>
                                        {formData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Regulations / Normative */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-bg-deep/30 rounded-2xl border border-border-thin">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <FileText size={12} /> Resolución de Aprobación
                            </label>
                            <input
                                type="text"
                                disabled={isReadOnly || !isAdmin}
                                value={formData.resolucion_aprobacion}
                                onChange={(e) => setFormData({ ...formData, resolucion_aprobacion: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                                placeholder={!isAdmin ? "ASIGNADO TRAS APROBACIÓN" : "ACTA-DI-2026-001"}
                            />
                            {!isAdmin && (
                                <p className="text-[8px] text-text-dim/60 uppercase font-bold tracking-wider">
                                    Solo el administrador puede definir este valor tras la aprobación de la propuesta.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} /> Fecha de Creación / Propuesta
                            </label>
                            <input
                                type="date"
                                disabled={isReadOnly || !isAdmin}
                                value={formData.fecha_creacion}
                                onChange={(e) => setFormData({ ...formData, fecha_creacion: e.target.value })}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                    </section>
                </form>

                <div className="modal-footer">
                    <button
                        onClick={handleCloseModal}
                        className="btn-vercel-secondary"
                    >
                        {isReadOnly ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSubmitForm}
                            className="btn-vercel-primary flex items-center gap-2"
                        >
                            {editingGroup ? 'Guardar Cambios' : 'Proponer Grupo'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
