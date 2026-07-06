import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Search, CheckCircle, User, UserMinus, Shield, Award, FileText, ChevronRight, BookOpen
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
    telefono_contacto?: string;
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
    proyectos?: any[];
    Proyectos?: any[];
    link_whatsapp?: string;
    telefono_coordinador?: string;
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
    dominios,
    carreras,
    lines,
    fetchData,
    setConfirmDialog,
    formatCareerName,
    onDraftCleared
}) => {
    const isInitializedRef = useRef(false);
    const [isDraftRestored, setIsDraftRestored] = useState(false);

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
        fecha_creacion: new Date().toISOString().split('T')[0],
        categoria_consolidacion: 'En Formación',
        lineas_ids: [] as number[],
        carreras_ids: [] as number[],
        link_whatsapp: '',
        telefono_coordinador: ''
    });

    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [selectedCoordName, setSelectedCoordName] = useState('');
    const [selectedCoordCareer, setSelectedCoordCareer] = useState('');

    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherPhone, setTeacherPhone] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
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

    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            setIsDraftRestored(false);
            return;
        }

        const draftKey = 'new_group_form_draft';
        const draft = localStorage.getItem(draftKey);
        if (draft) {
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
                        carreras_ids: Array.isArray(parsed.formData.carreras_ids) ? parsed.formData.carreras_ids : [],
                        link_whatsapp: parsed.formData.link_whatsapp || '',
                        telefono_coordinador: parsed.formData.telefono_coordinador || ''
                    };
                    setFormData(validatedFormData);
                    setSelectedCoordName(parsed.selectedCoordName || '');
                    setSelectedCoordCareer(parsed.selectedCoordCareer || '');
                    setGroupMembers(Array.isArray(parsed.groupMembers) ? parsed.groupMembers : []);
                    setCoordSearchQuery('');
                    setIsDraftRestored(true);
                    isInitializedRef.current = true;
                    return;
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
            carreras_ids: [],
            link_whatsapp: '',
            telefono_coordinador: ''
        });
        setSelectedCoordName('');
        setSelectedCoordCareer('');
        setCoordSearchQuery('');
        setGroupMembers([]);
        setIsDraftRestored(false);
        isInitializedRef.current = true;
    }, [isOpen]);

    // debounces
    useEffect(() => {
        if (!showCoordResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(coordSearchQuery)}&tipo=profesor`);
                setCoordSearchResults(res.data || []);
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

    const handleAddTeacher = () => {
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

    const handleAddStudent = () => {
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

    const clearDraft = () => {
        localStorage.removeItem('new_group_form_draft');
        localStorage.removeItem('groups_draft_metadata');
        if (onDraftCleared) {
            onDraftCleared();
        }
    };

    // Auto-save draft on state changes
    useEffect(() => {
        if (!isOpen || !isInitializedRef.current) return;

        const draftData = {
            formData,
            selectedCoordName,
            selectedCoordCareer,
            groupMembers
        };

        localStorage.setItem('new_group_form_draft', JSON.stringify(draftData));
        const meta = {
            type: 'new',
            groupName: formData.nombre || 'Borrador de Nueva Propuesta',
            timestamp: Date.now()
        };
        localStorage.setItem('groups_draft_metadata', JSON.stringify(meta));
    }, [formData, selectedCoordName, selectedCoordCareer, groupMembers, isOpen]);

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones del lado del cliente
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
                miembros: groupMembers.map(m => ({
                    id_usuario: m.id_usuario || 0,
                    cedula: m.cedula,
                    nombre_completo: m.nombre_completo,
                    rol: m.rol,
                    activo: true,
                    telefono_contacto: m.telefono_contacto
                }))
            };

            await api.post('/Groups', payload);
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
        const hasChanges = 
            formData.nombre.trim() !== '' ||
            formData.siglas.trim() !== '' ||
            formData.objetivo_general.trim() !== '' ||
            formData.mision.trim() !== '' ||
            formData.vision.trim() !== '' ||
            groupMembers.length > 0;

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

    return (
        <div className="fixed inset-0 z-[10000] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleCloseModal}
            />

            <div className="relative h-full flex items-center">
                <div className="relative w-full max-w-3xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                    <div className="modal-header">
                        <div className="flex items-center gap-3">
                            <div className="icon-circle icon-circle-brand">
                                <Award size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-main tracking-tight">
                                    Nuevo Grupo de Investigación
                                </h3>
                                <p className="section-label text-text-dim">Configuración de propuesta y equipo inicial</p>
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
                                            carreras_ids: [],
                                            link_whatsapp: '',
                                            telefono_coordinador: ''
                                        });
                                        setSelectedCoordName('');
                                        setSelectedCoordCareer('');
                                        setGroupMembers([]);
                                        localStorage.removeItem('new_group_form_draft');
                                        localStorage.removeItem('groups_draft_metadata');
                                        setIsDraftRestored(false);
                                        if (onDraftCleared) {
                                            onDraftCleared();
                                        }
                                    }}
                                    className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                                >
                                    Descartar borrador
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 animate-fade-up">
                            <div className="border border-border-thin bg-surface-hover rounded-lg p-3 flex items-center gap-3">
                                <Shield size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    Las propuestas se envían en estado <span className="text-text-main font-semibold">Pendiente</span> para su revisión y requieren aprobación formal del administrador antes de su activación.
                                </p>
                            </div>
                        </div>

                        {/* Basic Settings */}
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <Award size={12} /> Configuración Básica
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Nombre del Grupo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                        placeholder="Ej: Grupo de Investigación en Sistemas Inteligentes"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Siglas / Acrónimo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.siglas}
                                        onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase font-semibold"
                                        placeholder="Ej: GISI"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Tipo de Grupo</label>
                                    <select
                                        value={formData.tipo_grupo}
                                        onChange={(e) => setFormData({ ...formData, tipo_grupo: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                                    >
                                        <option value="Investigación">Grupo de Investigación</option>
                                        <option value="Semillero">Semillero de Investigación</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Dominio Académico</label>
                                    <select
                                        required
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
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Etapa del grupo</label>
                                    <select
                                        value={formData.categoria_consolidacion}
                                        onChange={(e) => setFormData({ ...formData, categoria_consolidacion: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                                    >
                                        <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                                        <option value="Consolidado">Consolidado (Trayectoria Probada)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Coordinator selection */}
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <User size={12} /> Coordinador Responsable
                            </h4>
                            <div className="p-6 bg-bg-deep/20 rounded-2xl border border-border-thin space-y-4">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Buscar Coordinador</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
                                        <input
                                            type="text"
                                            value={coordSearchQuery}
                                            onChange={(e) => {
                                                setCoordSearchQuery(e.target.value);
                                                setShowCoordResults(true);
                                            }}
                                            onFocus={() => setShowCoordResults(true)}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg pl-10 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase placeholder:normal-case font-medium"
                                            placeholder={selectedCoordName ? selectedCoordName : "Buscar docente por nombre o cédula..."}
                                        />
                                        {showCoordResults && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[180px] overflow-y-auto z-30 custom-scrollbar">
                                                    {isCoordSearching ? (
                                                        <div className="p-3 text-center text-xs text-text-dim font-mono">
                                                            Buscando docente...
                                                        </div>
                                                    ) : coordSearchResults.length === 0 ? (
                                                        <div className="p-3 text-center text-xs text-text-dim font-mono">
                                                            No se encontraron docentes con ese nombre o cédula.
                                                        </div>
                                                    ) : (
                                                        coordSearchResults.map((teacher: any) => (
                                                            <button
                                                                key={teacher.cedula}
                                                                type="button"
                                                                onClick={() => handleSelectCoordinator(teacher)}
                                                                className="w-full text-left p-2.5 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                                        <span>{formatNombre(teacher.nombre)}</span>
                                                                        {teacher.horas_disponibles !== undefined && (
                                                                            <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                                (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                                    ? 'badge-vercel-success' 
                                                                                    : 'badge-vercel-error'
                                                                            }`}>
                                                                                Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                                </div>
                                                                <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                                    Docente
                                                                </span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Linked Careers (Visual indicator) */}
                        <section className="space-y-2 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Carreras Vinculadas Automáticamente</label>
                            {(() => {
                                const linkedCareers = formData.carreras_ids.map(carrId => {
                                    const career = carreras.find(c => c.id_carrera === carrId);
                                    return career ? career.carrera1 : null;
                                }).filter(c => c !== null) as string[];

                                const filtered = linkedCareers.filter((cName: string) => {
                                    const clean = cName.trim().toUpperCase();
                                    return clean !== 'DOCENTE' && clean !== 'ESTUDIANTE';
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="p-3 text-center text-[10px] text-text-dim font-mono bg-bg-deep/30 rounded-xl border border-dashed border-border-thin">
                                            Sin carreras vinculadas.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-wrap gap-2 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                                        {filtered.map((cName, idx) => (
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
                            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <Award size={12} /> Declaración de Identidad
                            </h4>
                            <div className="space-y-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Objetivo General</label>
                                    <textarea
                                        rows={3}
                                        value={formData.objetivo_general}
                                        onChange={(e) => setFormData({ ...formData, objetivo_general: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                        placeholder="Ej: Fomentar el desarrollo e integración de soluciones tecnológicas..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Misión</label>
                                        <textarea
                                            rows={3}
                                            value={formData.mision}
                                            onChange={(e) => setFormData({ ...formData, mision: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                            placeholder="La misión del grupo de investigación..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Visión</label>
                                        <textarea
                                            rows={3}
                                            value={formData.vision}
                                            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                            placeholder="Consolidarse como un referente académico..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Research Lines */}
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={12} /> Líneas de Investigación Institucionales
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                {lines.map(line => (
                                    <div
                                        key={line.id}
                                        onClick={() => toggleLine(line.id)}
                                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                                            formData.lineas_ids.includes(line.id)
                                                ? 'bg-text-main/10 border-text-main text-text-main'
                                                : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            formData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                        }`}>
                                            {formData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Members addition */}
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <Users size={12} /> Equipo de Trabajo Inicial
                            </h4>
                            <div className="space-y-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                {/* Current members list */}
                                {groupMembers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-text-dim bg-bg-deep/30 rounded-xl border border-dashed border-border-thin font-mono uppercase">
                                        Sin integrantes agregados.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {groupMembers.map(member => (
                                            <div key={member.id_grupo_miembro} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-thin animate-fade-up">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-black bg-surface-hover text-text-dim">
                                                        {member.rol === 'Director' ? <Shield size={14} /> : <User size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-text-main">{formatNombre(member.nombre_completo)}</p>
                                                        <p className="text-[8px] font-bold uppercase text-text-dim mt-0.5">{member.rol} {member.carrera ? `| ${formatCareerName(member.carrera)}` : ''}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                    className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
                                                >
                                                    <UserMinus size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add teacher form */}
                                <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
                                    <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                        <Plus size={10} /> Añadir Docente Investigador
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 relative">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Docente</label>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                                                <input
                                                    type="text"
                                                    value={teacherSearchQuery}
                                                    onChange={(e) => {
                                                        setTeacherSearchQuery(e.target.value);
                                                        setShowTeacherResults(true);
                                                    }}
                                                    onFocus={() => setShowTeacherResults(true)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                                    placeholder="Buscar por nombre o cédula..."
                                                />
                                                {showTeacherResults && (
                                                    <>
                                                        <div className="fixed inset-0 z-20" onClick={() => setShowTeacherResults(false)}></div>
                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                                            {isTeacherSearching ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    Buscando...
                                                                </div>
                                                            ) : teacherSearchResults.length === 0 ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    No se encontraron resultados.
                                                                </div>
                                                            ) : (
                                                                teacherSearchResults.map((teacher: any) => (
                                                                    <button
                                                                        key={teacher.cedula}
                                                                        type="button"
                                                                        onClick={() => handleSelectTeacher(teacher)}
                                                                        className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                                                    >
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                                                <span>{formatNombre(teacher.nombre)}</span>
                                                                                {teacher.horas_disponibles !== undefined && (
                                                                                    <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                                        (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                                            ? 'badge-vercel-success' 
                                                                                            : 'badge-vercel-error'
                                                                                    }`}>
                                                                                        Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                            <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                                        </div>
                                                                        <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                                            Docente
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Teléfono (WhatsApp)</label>
                                            <input
                                                type="tel"
                                                value={teacherPhone}
                                                onChange={(e) => setTeacherPhone(e.target.value)}
                                                placeholder="Opcional"
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                            <select
                                                value={teacherRol}
                                                onChange={(e) => setTeacherRol(e.target.value)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                            >
                                                <option value="Co-Investigador">Co-Investigador</option>
                                                <option value="Director de Proyecto">Director de Proyecto</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddTeacher}
                                        disabled={!selectedTeacher}
                                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Añadir Docente
                                    </button>
                                </div>

                                {/* Add student form */}
                                <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
                                    <h5 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                        <Plus size={10} /> Añadir Estudiante Semillerista
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1 relative">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Estudiante</label>
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                                                <input
                                                    type="text"
                                                    value={studentSearchQuery}
                                                    onChange={(e) => {
                                                        setStudentSearchQuery(e.target.value);
                                                        setShowStudentResults(true);
                                                    }}
                                                    onFocus={() => setShowStudentResults(true)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                                    placeholder="Buscar por nombre o cédula..."
                                                />
                                                {showStudentResults && (
                                                    <>
                                                        <div className="fixed inset-0 z-20" onClick={() => setShowStudentResults(false)}></div>
                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                                            {isStudentSearching ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    Buscando...
                                                                </div>
                                                            ) : studentSearchResults.length === 0 ? (
                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                    No se encontraron resultados.
                                                                </div>
                                                            ) : (
                                                                studentSearchResults.map((student: any) => (
                                                                    <button
                                                                        key={student.cedula}
                                                                        type="button"
                                                                        onClick={() => handleSelectStudent(student)}
                                                                        className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors"
                                                                    >
                                                                        <p className="font-semibold text-text-main text-xs">{formatNombre(student.nombre)}</p>
                                                                        <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {student.cedula} | {student.carrera || 'SIN CARRERA'}</p>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Teléfono (WhatsApp)</label>
                                            <input
                                                type="tel"
                                                value={studentPhone}
                                                onChange={(e) => setStudentPhone(e.target.value)}
                                                placeholder="Opcional"
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                            <select
                                                value={studentRol}
                                                onChange={(e) => setStudentRol(e.target.value)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                            >
                                                <option value="Semillerista">Semillerista</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddStudent}
                                        disabled={!selectedStudent}
                                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                                    >
                                        Añadir Estudiante
                                    </button>
                                </div>
                            </div>
                        </section>
                    </form>

                    <div className="modal-footer shrink-0 border-t border-border-thin bg-surface">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="btn-vercel-secondary !py-2 !px-4"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitForm}
                                className="btn-vercel-primary !py-2 !px-5"
                            >
                                Enviar Propuesta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
