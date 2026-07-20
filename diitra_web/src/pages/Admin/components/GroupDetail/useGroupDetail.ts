import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import api from '../../../../api/axios_config';
import { coworkLog } from '../../../../core/cowork/utils/log';
import { useConfirm } from '../../../../api/ConfirmContext';

export interface GroupMember {
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

export interface Group {
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
    teacherMemberCedulas?: string[];
}

export interface Career {
    id_carrera: number;
    carrera1: string;
}

export interface ResearchLine {
    id: number;
    nombre: string;
}

interface UseGroupDetailProps {
    isOpen: boolean;
    detailGroup: Group | null;
    setDetailGroup: React.Dispatch<React.SetStateAction<Group | null>>;
    isAdmin: boolean;
    user: any;
    carreras: Career[];
    lines: ResearchLine[];
    isEditingInitial?: boolean;
    fetchData?: () => void;
    onClose: () => void;
}

export const useGroupDetail = ({
    isOpen,
    detailGroup,
    setDetailGroup,
    isAdmin,
    user,
    carreras,
    lines,
    isEditingInitial,
    fetchData,
    onClose
}: UseGroupDetailProps) => {
    const confirm = useConfirm();
    
    // States
    const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
    const [detailTab, setDetailTab] = useState<'info' | 'feedback' | 'proyectos'>('info');
    const [feedbackComments, setFeedbackComments] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [newFeedbackText, setNewFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

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

    // Search and auto-completes
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

    // Contextual field feedback states
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
    const [activeFieldName, setActiveFieldName] = useState<string>('');
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [highlightedField, setHighlightedField] = useState<string | null>(null);

    // Audio recording state & refs
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const openTimeRef = useRef<number>(0);

    // SignalR Hub Connection
    const [collabConnection, setCollabConnection] = useState<signalR.HubConnection | null>(null);

    const userRef = user?.id_referencia?.trim();
    const canEdit = detailGroup && (isAdmin || 
        (detailGroup.id_profesor_coordinador?.trim() === userRef && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación') ||
        (detailGroup.teacherMemberCedulas && detailGroup.teacherMemberCedulas.some((ced: string) => ced.trim() === userRef) && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación'));

    const isMember = isAdmin || 
        (detailGroup && detailGroup.id_profesor_coordinador?.trim() === user?.id_referencia?.trim()) || 
        detailMembers.some(m => m.activo && (m.cedula?.trim() === user?.id_referencia?.trim() || m.cedula?.trim() === user?.cedula?.trim() || m.id_usuario === user?.id_usuario));

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

    const handleSelectCoordinator = (teacher: any) => {
        if (detailMembers.some(m => m.cedula === teacher.cedula)) {
            alert("Este docente ya es un integrante del grupo y no puede ser asignado como Coordinador Responsable.");
            return;
        }
        
        const updatedCarreras = recalculateCarreras(teacher.carrera || '', detailMembers);
        setEditFormData(prev => ({
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

    const refreshGroupDetail = async () => {
        if (!detailGroup?.uuid) return;
        try {
            const res = await api.get(`/Groups/${detailGroup.uuid}`);
            const fullGroup = res.data;
            if (fullGroup) {
                setDetailGroup(fullGroup);
                if (fullGroup.miembros) {
                    setDetailMembers(fullGroup.miembros.filter((m: any) => m.activo));
                } else {
                    setDetailMembers([]);
                }
            }
        } catch (err) {
            console.error("Error loading group detail:", err);
        }
    };

    const handleAddTeacher = async () => {
        if (!selectedTeacher || !detailGroup) return;

        if (selectedTeacher.cedula === editFormData.id_profesor_coordinador) {
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

    const toggleLine = (lineId: number) => {
        setEditFormData(prev => {
            const linesList = prev.lineas_ids.includes(lineId)
                ? prev.lineas_ids.filter(id => id !== lineId)
                : [...prev.lineas_ids, lineId];
            return { ...prev, lineas_ids: linesList };
        });
    };

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

    // Fetch initial data
    useEffect(() => {
        if (!isOpen || !detailGroup?.uuid) return;
        openTimeRef.current = Date.now();
        setDetailTab('info');
        setIsEditing(!!isEditingInitial);
        refreshGroupDetail();
    }, [isOpen, detailGroup?.uuid, isEditingInitial]);

    const fetchFeedbackComments = async (uuid: string) => {
        setLoadingFeedback(true);
        try {
            const res = await api.get(`/collaboration/${uuid}/pulse`);
            if (res.data && res.data.comments) {
                const mappedComments = res.data.comments.map((c: any) => ({
                    idComentario: c.idComentario ?? c.id_comentario ?? c.idComentario,
                    usuarioUuid: c.usuarioUuid ?? c.usuario_uuid ?? '',
                    nombreUsuario: c.nombreUsuario ?? c.nombre_usuario ?? 'Usuario',
                    contenido: c.contenido ?? '',
                    idPadre: c.idPadre ?? c.id_padre ?? null,
                    creadoEn: c.creadoEn ?? c.creado_en ?? new Date().toISOString()
                }));
                const sorted = [...mappedComments].reverse();
                setFeedbackComments(sorted);
            } else {
                setFeedbackComments([]);
            }
        } catch (err) {
            console.error("Error al cargar comentarios de retroalimentación:", err);
            setFeedbackComments([]);
        } finally {
            setLoadingFeedback(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid || !isMember) return;
        fetchFeedbackComments(detailGroup.uuid);
    }, [isOpen, detailGroup?.uuid, isMember]);

    // SignalR Connection Effect
    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid || !isMember) {
            if (collabConnection) {
                collabConnection.stop();
                setCollabConnection(null);
            }
            return;
        }

        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const apiRoot = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;
        const hubUrl = `${apiRoot}/hubs/collaboration`;
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .build();

        let isSubscribed = true;

        newConnection.start()
            .then(async () => {
                if (!isSubscribed) {
                    newConnection.stop();
                    return;
                }
                coworkLog('[GroupsPage] Conexión de colaboración en tiempo real establecida');

                const userName = user?.nombre_completo || 'Usuario';
                const userUuid = user?.id_referencia || '0';
                const userRole = isAdmin ? 'Admin' : 'Docente';

                try {
                    await newConnection.invoke(
                        'JoinDocument',
                        detailGroup.uuid.toLowerCase().trim(),
                        userName,
                        userUuid,
                        userRole
                    );
                    coworkLog('[GroupsPage] Unido a la sala de colaboración:', detailGroup.uuid);
                } catch (err) {
                    console.error('[GroupsPage] Error al unirse a la sala:', err);
                }

                newConnection.on('NewCommentReceived', (data: any) => {
                    setFeedbackComments(prev => {
                        const commentId = data.idComentario || data.id_comentario || data.idComentario;
                        if (prev.some(c => (c.idComentario || c.id_comentario) === commentId)) {
                            return prev;
                        }
                        
                        const normalizedComment = {
                            idComentario: commentId,
                            usuarioUuid: data.usuarioUuid || data.usuario_uuid,
                            nombreUsuario: data.nombreUsuario || data.nombre_usuario,
                            contenido: data.contenido,
                            idPadre: data.idPadre || data.id_padre,
                            creadoEn: data.creadoEn || data.creado_en || new Date().toISOString()
                        };
                        return [...prev, normalizedComment];
                    });
                });

                newConnection.on('CommentUpdated', (data: any) => {
                    setFeedbackComments(prev => prev.map(c => {
                        const commentId = c.idComentario || c.id_comentario;
                        if (commentId === data.idComentario) {
                            return { ...c, contenido: data.contenido };
                        }
                        return c;
                    }));
                });

                newConnection.on('CommentDeleted', (data: any) => {
                    setFeedbackComments(prev => prev.filter(c => {
                        const commentId = c.idComentario || c.id_comentario;
                        return commentId !== data.idComentario;
                    }));
                });
            })
            .catch(err => {
                if (err.name === 'AbortError' || err.message?.includes('stop() was called')) {
                    return;
                }
                console.error('[GroupsPage] Error de conexión de SignalR:', err);
            });

        setCollabConnection(newConnection);

        return () => {
            isSubscribed = false;
            newConnection.stop().catch(() => {});
        };
    }, [isOpen, detailGroup?.uuid, isMember]);

    // Audio Recorder
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error starting voice recorder:", err);
            alert("No se pudo acceder al micrófono. Verifique los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleSendFeedbackMessage = async (groupUuid: string, parentId?: number) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        setSendingFeedback(true);
        try {
            let contentStr = '';

            if (audioBlob) {
                const formDataObj = new FormData();
                formDataObj.append('file', audioBlob, `audio_feedback_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const payload = {
                    type: 'audio',
                    audioUrl: uploadRes.data.url,
                    text: newFeedbackText.trim() || 'Explicación de audio adjunta'
                };
                contentStr = JSON.stringify(payload);
            } else {
                contentStr = newFeedbackText.trim();
            }

            await api.post('/collaboration/comments', {
                documentoUuid: groupUuid,
                DocumentoUuid: groupUuid,
                documento_uuid: groupUuid,
                contenido: contentStr,
                Contenido: contentStr,
                idPadre: parentId || null,
                IdPadre: parentId || null,
                id_padre: parentId || null
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(groupUuid);
        } catch (err: any) {
            console.error("Error al enviar comentario de retroalimentación:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    const handleUpdateComment = async (id: number, nuevoContenido: string) => {
        try {
            await api.put(`/collaboration/comments/${id}`, { contenido: nuevoContenido });
            setEditingCommentId(null);
            setEditingCommentText('');
            if (detailGroup?.uuid) {
                await fetchFeedbackComments(detailGroup.uuid);
            }
        } catch (err: any) {
            console.error("Error al actualizar comentario:", err);
            alert("No se pudo actualizar el comentario: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteComment = async (id: number) => {
        const hasConfirmed = await confirm({
            title: 'Eliminar Comentario',
            message: '¿Está seguro de que desea eliminar este comentario? Esta acción eliminará también sus respuestas.',
            variant: 'destructive',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
        if (!hasConfirmed) return;

        try {
            await api.delete(`/collaboration/comments/${id}`);
            if (detailGroup?.uuid) {
                await fetchFeedbackComments(detailGroup.uuid);
            }
        } catch (err: any) {
            console.error("Error al eliminar comentario:", err);
            alert("No se pudo eliminar el comentario: " + (err.response?.data?.message || err.message));
        }
    };

    const parseCommentContent = (contenido: string) => {
        try {
            if (contenido.trim().startsWith('{')) {
                const parsed = JSON.parse(contenido);
                return parsed;
            }
        } catch (e) {}
        return null;
    };

    const getFieldComments = (fieldKey: string) => {
        return feedbackComments.filter(c => {
            const parsed = parseCommentContent(c.contenido);
            return parsed && parsed.type === 'field_feedback' && parsed.field === fieldKey;
        });
    };

    const openFieldFeedbackDrawer = (fieldKey: string, fieldName: string) => {
        setActiveFieldKey(fieldKey);
        setActiveFieldName(fieldName);
        setIsFieldModalOpen(true);
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleSendFieldFeedback = async (fieldKey: string, fieldName: string) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        if (!detailGroup?.uuid) {
            alert("Error: No se pudo identificar el grupo.");
            return;
        }
        setSendingFeedback(true);
        try {
            let uploadedAudioUrl = '';
            if (audioBlob) {
                const formDataObj = new FormData();
                formDataObj.append('file', audioBlob, `audio_field_${fieldKey}_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedAudioUrl = uploadRes.data.url;
            }

            const payload = {
                type: 'field_feedback',
                field: fieldKey,
                fieldName: fieldName,
                text: newFeedbackText.trim(),
                audioUrl: uploadedAudioUrl
            };
            const contentStr = JSON.stringify(payload);

            await api.post('/collaboration/comments', {
                documentoUuid: detailGroup.uuid,
                DocumentoUuid: detailGroup.uuid,
                documento_uuid: detailGroup.uuid,
                contenido: contentStr,
                Contenido: contentStr,
                idPadre: null,
                IdPadre: null,
                id_padre: null
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(detailGroup.uuid);
        } catch (err: any) {
            console.error("Error al enviar comentario de retroalimentación de campo:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    return {
        // States & refs
        detailMembers,
        setDetailMembers,
        detailTab,
        setDetailTab,
        feedbackComments,
        loadingFeedback,
        newFeedbackText,
        setNewFeedbackText,
        sendingFeedback,
        editingCommentId,
        setEditingCommentId,
        editingCommentText,
        setEditingCommentText,
        isEditing,
        setIsEditing,
        savingInline,
        isDraftRestored,
        editFormData,
        setEditFormData,
        selectedCoordName,
        setSelectedCoordName,
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
        activeFieldKey,
        setActiveFieldKey,
        activeFieldName,
        setActiveFieldName,
        isFieldModalOpen,
        setIsFieldModalOpen,
        highlightedField,
        setHighlightedField,
        isRecording,
        recordingTime,
        audioUrl,
        audioBlob,
        setAudioBlob,
        setAudioUrl,

        // Computed
        canEdit,
        isMember,
        detailGroup,
        isAdmin,
        lines,

        // Actions
        handleSelectCoordinator,
        handleSelectTeacher,
        handleSelectStudent,
        handleAddTeacher,
        handleAddStudent,
        handleRemoveMember,
        toggleLine,
        clearDraft,
        handleCloseAttempt,
        handleSaveInlineChanges,
        startRecording,
        stopRecording,
        cancelRecording,
        handleSendFeedbackMessage,
        handleUpdateComment,
        handleDeleteComment,
        getFieldComments,
        openFieldFeedbackDrawer,
        handleSendFieldFeedback,
        refreshGroupDetail
    };
};

