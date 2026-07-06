import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import {
    Users, Shield, Award, Calendar, CheckCircle, XCircle, AlertTriangle, BookOpen, GraduationCap, User, MessageSquare, Send, Mic, Loader2, ChevronRight, MessageCircle, Edit2,
    Plus, Search, UserMinus, FileText
} from 'lucide-react';
import api from '../../../api/axios_config';
import { AudioBubblePlayer } from './AudioBubblePlayer';
import { coworkLog } from '../../../core/cowork/utils/log';


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
    teacherMemberCedulas?: string[];
}

interface Domain {
    id_dominio: number;
    nombre: string;
}

interface Career {
    id_carrera: number;
    carrera1: string;
}

interface ResearchLine {
    id: number;
    nombre: string;
}

interface GroupDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    detailGroup: Group | null;
    setDetailGroup: React.Dispatch<React.SetStateAction<Group | null>>;
    isAdmin: boolean;
    user: any;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    handleOpenReview: (group: Group) => void;
    fetchData?: () => void;
    onEdit?: (group: Group) => void;
    isEditingInitial?: boolean;
}

const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

const formatWhatsappLink = (phone: string | null | undefined) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '');
    return `https://wa.me/593${cleanPhone}`;
};

export const GroupDetailDrawer: React.FC<GroupDetailDrawerProps> = ({
    isOpen,
    onClose,
    detailGroup,
    setDetailGroup,
    isAdmin,
    user,
    dominios,
    carreras,
    lines,
    formatCareerName,
    handleOpenReview,
    fetchData,
    isEditingInitial
}) => {
    const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
    const [detailTab, setDetailTab] = useState<'info' | 'feedback' | 'proyectos'>('info');
    const [feedbackComments, setFeedbackComments] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [newFeedbackText, setNewFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    const userRef = user?.id_referencia?.trim();
    const canEdit = detailGroup && (isAdmin || 
        (detailGroup.id_profesor_coordinador?.trim() === userRef && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación') ||
        (detailGroup.teacherMemberCedulas && detailGroup.teacherMemberCedulas.some((ced: string) => ced.trim() === userRef) && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación'));

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
        } catch (error: any) {
            console.error("Error al agregar integrante docente:", error);
            alert("No se pudo agregar al docente: " + (error.response?.data?.message || error.message));
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
        } catch (error: any) {
            console.error("Error al agregar estudiante:", error);
            alert("No se pudo agregar al estudiante: " + (error.response?.data?.message || error.message));
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
            const lines = prev.lineas_ids.includes(lineId)
                ? prev.lineas_ids.filter(id => id !== lineId)
                : [...prev.lineas_ids, lineId];
            return { ...prev, lineas_ids: lines };
        });
    };

    const clearDraft = () => {
        if (detailGroup) {
            localStorage.removeItem(`edit_group_form_draft_${detailGroup.uuid}`);
            localStorage.removeItem('groups_draft_metadata');
            setIsDraftRestored(false);
            window.dispatchEvent(new CustomEvent('diitra:group-draft-cleared'));

            // Restablecer los campos a los valores originales del servidor
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

    const handleCloseAttempt = (action: 'cancel-edit' | 'close-drawer') => {
        if (isEditing && hasChangesFromDb()) {
            const confirmDiscard = window.confirm("Tiene cambios no guardados en el borrador de edición. ¿Está seguro de que desea salir? Se perderán las modificaciones.");
            if (!confirmDiscard) return;
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

    // Conexión a SignalR en tiempo real
    const [collabConnection, setCollabConnection] = useState<signalR.HubConnection | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow textarea as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '48px'; // Reset to default height
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(150, Math.max(48, scrollHeight))}px`;
        }
    }, [newFeedbackText, activeFieldKey]);

    const isMember = isAdmin || 
        (detailGroup && detailGroup.id_profesor_coordinador?.trim() === user?.id_referencia?.trim()) || 
        detailMembers.some(m => m.activo && (m.cedula?.trim() === user?.id_referencia?.trim() || m.cedula?.trim() === user?.cedula?.trim() || m.id_usuario === user?.id_usuario));

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

    const handleSaveInlineChanges = async () => {
        if (!detailGroup?.uuid) return;

        // Validaciones del lado del cliente
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

    // Fetch detail members when drawer is open
    useEffect(() => {
        if (!isOpen || !detailGroup?.uuid) return;
        openTimeRef.current = Date.now();
        setDetailTab('info');
        setIsEditing(!!isEditingInitial);
        refreshGroupDetail();
    }, [isOpen, detailGroup?.uuid, isEditingInitial]);

    // Fetch feedback comments only when user is a confirmed group member / coordinator / admin
    useEffect(() => {
        if (!isOpen || !detailGroup || !detailGroup.uuid || !isMember) return;
        fetchFeedbackComments(detailGroup.uuid);
    }, [isOpen, detailGroup?.uuid, isMember]);

    // SignalR Effect
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
            })
            .catch(err => {
                // Evitar registrar en consola los errores benignos de cancelación/aborto por desmontado rápido
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

    // Voice recording helpers
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
            console.error("Error: detailGroup.uuid is undefined or null");
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

    const renderFieldFeedbackButton = (fieldKey: string, fieldName: string) => {
        const comments = getFieldComments(fieldKey);
        const hasComments = comments.length > 0;
        
        if (!isMember) return null;
        if (!hasComments && !isAdmin) return null;
        
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    openFieldFeedbackDrawer(fieldKey, fieldName);
                }}
                className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all active:scale-95 shrink-0 ${
                    hasComments
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30'
                        : 'border-transparent text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                }`}
                title={hasComments ? `Ver ${comments.length} observaciones` : 'Agregar observación contextual'}
            >
                <MessageSquare size={13} className={hasComments ? 'fill-amber-500/5 text-amber-500' : ''} />
                {hasComments && (
                    <span className="text-[8px] font-mono font-bold leading-none bg-amber-500 text-bg-deep px-1.5 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                )}
            </button>
        );
    };

    if (!isOpen || !detailGroup) return null;

    const teachers = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return !rolLower.includes('semillerista') && !rolLower.includes('estudiante');
    });

    const students = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return rolLower.includes('semillerista') || rolLower.includes('estudiante');
    });

    const projectsList = detailGroup.proyectos || detailGroup.Proyectos || [];
    const projectsCount = projectsList.length;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={() => {
                    // Evitar que un doble clic rápido cierre el drawer inmediatamente después de abrirse
                    if (Date.now() - openTimeRef.current < 300) {
                        return;
                    }
                    handleCloseAttempt('close-drawer');
                }}
            />

            <div className="relative h-full flex items-center">
                {/* Floating Side Panel for Field Feedback */}
                {isFieldModalOpen && activeFieldKey && (
                    <div className="absolute md:right-[calc(100%+16px)] right-4 left-4 md:left-auto md:top-[40%] md:-translate-y-1/2 bottom-6 md:bottom-auto w-auto md:w-[340px] max-h-[calc(100vh-48px)] h-fit bg-surface border border-border-thin rounded-2xl flex flex-col z-20 animate-fade-in shadow-xl overflow-hidden">
                    <div className="modal-header shrink-0 !py-3 !px-4 bg-bg-deep/40 border-b border-border-thin">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)] shrink-0">
                                <MessageSquare size={14} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[10px] font-black text-text-main uppercase tracking-tight truncate leading-none mb-1">Observación Contextual</h4>
                                <p className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest truncate leading-none">{activeFieldName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsFieldModalOpen(false);
                                setActiveFieldKey(null);
                                setAudioBlob(null);
                                setAudioUrl('');
                            }}
                            className="p-1 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors shrink-0"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* List of comments for this field */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-deep/5 custom-scrollbar">
                        {(() => {
                            const comments = getFieldComments(activeFieldKey);
                            if (comments.length === 0) {
                                return (
                                    <div className="text-center py-16 opacity-50 flex flex-col items-center justify-center h-full">
                                        <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                            <MessageSquare size={18} className="text-text-dim" />
                                        </div>
                                        <p className="text-[9px] font-black text-text-main uppercase tracking-wider">Sin observaciones</p>
                                        <p className="text-[8px] text-text-dim mt-1 max-w-[180px] leading-relaxed uppercase font-mono text-center">
                                            {isAdmin 
                                                ? "Agregue observaciones por escrito o grabe explicaciones de voz sobre este campo."
                                                : "No se han registrado observaciones en este campo."
                                            }
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-3">
                                    {comments.map((c, i) => {
                                        const parsed = parseCommentContent(c.contenido);
                                        const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                        const isMe = c.usuarioUuid === user?.id_referencia;
                                        
                                        return (
                                            <div
                                                key={c.idComentario || i} 
                                                className={`flex flex-col w-full max-w-[90%] ${
                                                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                } animate-fade-up`}
                                            >
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={`text-[8px] font-black uppercase tracking-wider ${
                                                        isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand'
                                                    }`}>
                                                        {isMe ? 'Tú' : c.nombreUsuario}
                                                    </span>
                                                    <span className="text-[7px] text-text-dim font-mono">
                                                        {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className={`rounded-xl p-3 border shadow-sm select-text transition-all duration-300 ${
                                                    isMe
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                        : isMsgFromAdmin
                                                            ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                            : 'bg-surface border-border-thin text-text-main rounded-tl-none hover:border-border-hover'
                                                }`}>
                                                    {parsed ? (
                                                        <div className="space-y-2">
                                                            {parsed.text && <p className="text-[11px] font-medium leading-relaxed">{parsed.text}</p>}
                                                            {parsed.audioUrl && (
                                                                <div className="mt-1">
                                                                    <AudioBubblePlayer src={parsed.audioUrl} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-medium leading-relaxed">{c.contenido}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Chat field feedback Input */}
                    <div className="p-4 border-t border-border-thin bg-surface-hover/30 shrink-0 space-y-3">
                        {isRecording ? (
                            <div className="flex items-center justify-between bg-red-500/5 border border-red-500/25 rounded-xl p-2 px-3 animate-pulse">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-[8px] font-black uppercase text-red-400 tracking-wider font-mono">
                                        Grabando ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={cancelRecording}
                                        className="px-1.5 py-0.5 hover:bg-surface border border-border-thin rounded text-[8px] font-bold uppercase tracking-widest text-text-dim transition-all"
                                    >
                                        x
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                                    >
                                        ok
                                    </button>
                                </div>
                            </div>
                        ) : audioUrl ? (
                            <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 animate-fade-in">
                                <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                                    <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Audio grabado</span>
                                    <AudioBubblePlayer src={audioUrl} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                    className="px-1.5 py-0.5 hover:bg-red-500/10 rounded text-[8px] font-bold uppercase tracking-widest text-red-500 transition-all shrink-0"
                                >
                                    Descartar
                                </button>
                            </div>
                        ) : null}

                        <div className="flex items-end gap-1.5 relative">
                            <textarea
                                ref={textareaRef}
                                value={newFeedbackText}
                                onChange={(e) => setNewFeedbackText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendFieldFeedback(activeFieldKey, activeFieldName);
                                    }
                                }}
                                placeholder={isAdmin ? "Observación..." : "Responder..."}
                                className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-2 pr-12 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-12 transition-colors custom-scrollbar placeholder:text-text-dim/60 font-medium"
                            />

                            <div className="absolute right-1.5 bottom-1.5 flex gap-0.5">
                                {!audioUrl && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                        title="Grabar Audio Explicativo"
                                    >
                                        <Mic size={12} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                    onClick={() => handleSendFieldFeedback(activeFieldKey, activeFieldName)}
                                    className="p-1 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                >
                                    {sendingFeedback ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="icon-circle icon-circle-brand shrink-0">
                            <Award size={20} />
                        </div>
                        <div
                            id="field-container-siglas"
                            className={`min-w-0 transition-all duration-500 rounded-lg px-2 py-1 flex-1 ${
                                highlightedField === 'siglas'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold text-text-main tracking-tight truncate" title={detailGroup.nombre}>{detailGroup.nombre}</h3>
                            <div className="flex items-center gap-2">
                                <p className="section-label text-text-dim truncate">
                                    {detailGroup.tipo_grupo === 'Semillero' ? 'Semillero' : 'Grupo de Investigación'} — {detailGroup.siglas || 'SIN_SIGLAS'}
                                </p>
                                {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        {canEdit && detailTab === 'info' && (
                            <div className="flex items-center gap-1.5">
                                {isEditing ? (
                                    <button
                                        onClick={() => handleCloseAttempt('cancel-edit')}
                                        className="px-2.5 py-1.5 rounded-lg border border-text-main/20 bg-text-main/5 hover:bg-text-main/10 text-text-main text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                                        title="Volver a la vista de detalles"
                                    >
                                        <span>Vista Detalle</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-2.5 py-1.5 rounded-lg border border-text-main/20 bg-text-main/5 hover:bg-text-main/10 text-text-main text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                                        title="Editar propuesta directamente aquí"
                                    >
                                        <Edit2 size={12} />
                                        <span>Editar Aquí</span>
                                    </button>
                                )}

                            </div>
                        )}
                        {isMember && detailGroup.link_whatsapp && (
                            <a
                                href={detailGroup.link_whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                                title="Unirse al grupo de WhatsApp"
                            >
                                <MessageCircle size={12} />
                                <span>Grupo de WhatsApp</span>
                            </a>
                        )}
                        <button onClick={() => handleCloseAttempt('close-drawer')} className="text-text-dim hover:text-text-main transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-border-thin bg-surface-hover/20 shrink-0">
                    <button
                        onClick={() => setDetailTab('info')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                            detailTab === 'info'
                                ? 'border-text-main text-text-main bg-text-main/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <Award size={13} />
                        <span>Información General</span>
                    </button>
                    <button
                        onClick={() => setDetailTab('proyectos')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                            detailTab === 'proyectos'
                                ? 'border-text-main text-text-main bg-text-main/5'
                                : 'border-transparent text-text-dim hover:text-text-main'
                        }`}
                    >
                        <BookOpen size={13} />
                        <span>Proyectos Adscritos</span>
                        {projectsCount > 0 && (
                            <span className="text-[9px] font-mono font-bold bg-brand text-bg-deep px-1.5 py-0.5 rounded-full ml-1 animate-fade-in">
                                {projectsCount}
                            </span>
                        )}
                    </button>
                    {isMember && (
                        <button
                            onClick={() => setDetailTab('feedback')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 relative ${
                                detailTab === 'feedback'
                                    ? 'border-text-main text-text-main bg-text-main/5'
                                    : 'border-transparent text-text-dim hover:text-text-main'
                            }`}
                        >
                            <MessageSquare size={13} />
                            <span>Canal de Retroalimentación</span>
                            {detailGroup.estado === 'Pendiente' && (
                                <span className="absolute top-2.5 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            )}
                        </button>
                    )}
                </div>

                {detailTab === 'info' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isEditing ? (
                            <div className="space-y-6">
                                {isDraftRestored && (
                                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-up">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                            <p className="text-xs font-semibold">Edición restaurada desde un borrador local no guardado.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearDraft}
                                            className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-amber-500/20 hover:bg-amber-500/10 text-amber-500 active:scale-95 transition-all"
                                        >
                                            Descartar Borrador
                                        </button>
                                    </div>
                                )}
                                {/* Basic Settings */}
                                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Grupo</label>
                                            {renderFieldFeedbackButton('nombre', 'Nombre del Grupo')}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={editFormData.nombre}
                                            onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                            placeholder="Ej: Grupo de Investigación en Sistemas Inteligentes"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Siglas / Acrónimo</label>
                                            {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={editFormData.siglas}
                                            onChange={(e) => setEditFormData({ ...editFormData, siglas: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase font-semibold"
                                            placeholder="Ej: GISI"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tipo de Grupo</label>
                                            {renderFieldFeedbackButton('tipoGrupo', 'Tipo de Grupo')}
                                        </div>
                                        <select
                                            value={editFormData.tipo_grupo}
                                            onChange={(e) => setEditFormData({ ...editFormData, tipo_grupo: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                                        >
                                            <option value="Investigación">Grupo de Investigación</option>
                                            <option value="Semillero">Semillero de Investigación</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dominio Académico</label>
                                            {renderFieldFeedbackButton('idDominio', 'Dominio Académico')}
                                        </div>
                                        <select
                                            required
                                            value={editFormData.id_dominio}
                                            onChange={(e) => setEditFormData({ ...editFormData, id_dominio: e.target.value })}
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
                                            value={editFormData.categoria_consolidacion}
                                            onChange={(e) => setEditFormData({ ...editFormData, categoria_consolidacion: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                                        >
                                            <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                                            <option value="Consolidado">Consolidado (Trayectoria Probada)</option>
                                        </select>
                                    </div>

                                    {/* WhatsApp and Coordinator Phone */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Enlace de Grupo de WhatsApp (Opcional)</label>
                                        <input
                                            type="url"
                                            value={editFormData.link_whatsapp}
                                            onChange={(e) => setEditFormData({ ...editFormData, link_whatsapp: e.target.value })}
                                            placeholder="https://chat.whatsapp.com/..."
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Teléfono del Coordinador (Opcional)</label>
                                        <input
                                            type="tel"
                                            value={editFormData.telefono_coordinador}
                                            onChange={(e) => setEditFormData({ ...editFormData, telefono_coordinador: e.target.value })}
                                            placeholder="0999999999"
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-medium"
                                        />
                                    </div>

                                    {/* Coordinator Selection */}
                                    <div className="space-y-2 md:col-span-2 relative">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                            <User size={12} /> Coordinador Responsable
                                        </label>
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                            <input
                                                type="text"
                                                value={coordSearchQuery}
                                                onChange={(e) => {
                                                    setCoordSearchQuery(e.target.value);
                                                    setShowCoordResults(true);
                                                }}
                                                onFocus={() => setShowCoordResults(true)}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg pl-9 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase placeholder:normal-case font-medium"
                                                placeholder={selectedCoordName ? selectedCoordName : "Buscar docente por nombre o cédula..."}
                                            />
                                            {showCoordResults && (
                                                <>
                                                    <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[180px] overflow-y-auto z-30 custom-scrollbar">
                                                        {isCoordSearching ? (
                                                            <div className="p-3 text-center text-xs text-text-dim font-mono flex items-center justify-center gap-2">
                                                                <Loader2 size={12} className="animate-spin" /> Buscando docente...
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
                                </section>

                                {/* Linked Careers */}
                                <section className="space-y-2 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Carreras Vinculadas Automáticamente</label>
                                    {(() => {
                                        const linkedCareers = editFormData.carreras_ids.map(carrId => {
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
                                <section className="space-y-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                                            {renderFieldFeedbackButton('objetivoGeneral', 'Objetivo General')}
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={editFormData.objetivo_general}
                                            onChange={(e) => setEditFormData({ ...editFormData, objetivo_general: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Misión</label>
                                                {renderFieldFeedbackButton('mision', 'Misión')}
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={editFormData.mision}
                                                onChange={(e) => setEditFormData({ ...editFormData, mision: e.target.value })}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                            />
                                            </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                                                {renderFieldFeedbackButton('vision', 'Visión')}
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={editFormData.vision}
                                                onChange={(e) => setEditFormData({ ...editFormData, vision: e.target.value })}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                                            />
                                            </div>
                                    </div>
                                </section>

                                {/* Research Lines */}
                                <section className="space-y-4 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen size={12} /> Líneas de Investigación Institucionales
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {lines.map(line => (
                                            <div
                                                key={line.id}
                                                onClick={() => toggleLine(line.id)}
                                                className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                                                    editFormData.lineas_ids.includes(line.id)
                                                        ? 'bg-text-main/10 border-text-main text-text-main'
                                                        : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                    editFormData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                                }`}>
                                                    {editFormData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                                </div>
                                                <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Members Section (In-place additions and deletions) */}
                                <section className="space-y-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                    <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} /> Integrantes del Grupo
                                    </h4>

                                    {/* Existing members */}
                                    <div className="space-y-3">
                                        {detailMembers.map(member => (
                                            <div key={member.id_grupo_miembro} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-thin">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-black bg-surface-hover text-text-dim">
                                                        {member.rol?.includes('Director') ? <Shield size={14} /> : <User size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-text-main">{formatNombre(member.nombre_completo)}</p>
                                                        <p className="text-[8px] font-bold uppercase text-text-dim mt-0.5">{member.rol}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                    className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
                                                    title="Retirar Integrante"
                                                >
                                                    <UserMinus size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Teacher Investigator */}
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

                                    {/* Add Student Semillerista */}
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
                                </section>

                                {/* Admin approval fields */}
                                {isAdmin && (
                                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={12} /> Resolución de Aprobación
                                            </label>
                                            <input
                                                type="text"
                                                value={editFormData.resolucion_aprobacion}
                                                onChange={(e) => setEditFormData({ ...editFormData, resolucion_aprobacion: e.target.value })}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium"
                                                placeholder="ACTA-DI-2026-001"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                                <Calendar size={12} /> Fecha de Creación
                                            </label>
                                            <input
                                                type="date"
                                                value={editFormData.fecha_creacion}
                                                onChange={(e) => setEditFormData({ ...editFormData, fecha_creacion: e.target.value })}
                                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                            />
                                        </div>
                                    </section>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                        {/* Status & Type & Consolidation */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">
                                    <Shield size={12} /> Estado
                                </label>
                                {(!detailGroup.estado || detailGroup.estado === 'Aprobado') && (
                                    <span className="badge-vercel badge-vercel-success">
                                        <CheckCircle size={10} /> Aprobado
                                    </span>
                                )}
                                {detailGroup.estado === 'Pendiente' && (
                                    <span className="badge-vercel badge-vercel-warning">
                                        <Calendar size={10} /> Pendiente
                                    </span>
                                )}
                                {detailGroup.estado === 'En Evaluación' && (
                                    <span className="badge-vercel badge-vercel-info">
                                        <Loader2 size={10} className="animate-spin" /> En Evaluación
                                    </span>
                                )}
                                {detailGroup.estado === 'Rechazado' && (
                                    <span className="badge-vercel badge-vercel-error">
                                        <XCircle size={10} /> Rechazado
                                    </span>
                                )}
                                <p className={`text-[8px] font-mono tracking-wider uppercase mt-1 ${detailGroup.activo ? 'text-success' : 'text-text-dim/60'}`}>
                                    ● {detailGroup.activo ? 'Vigente' : 'Inactivo'}
                                </p>
                            </div>

                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">Tipo de Grupo</label>
                                <p className="text-xs font-black text-text-main uppercase tracking-tight">
                                    {detailGroup.tipo_grupo || 'Investigación'}
                                </p>
                            </div>

                            <div className="bento-card static p-4">
                                <label className="section-label text-text-dim mb-2">Etapa del grupo</label>
                                <span className={`badge-vercel ${
                                    detailGroup.categoria_consolidacion === 'Consolidado'
                                        ? 'badge-vercel-success'
                                        : 'badge-vercel-neutral'
                                }`}>
                                    {detailGroup.categoria_consolidacion || 'En Formación'}
                                </span>
                            </div>
                        </div>

                        {/* Coordinator */}
                        <div
                            id="field-container-coordinador"
                            className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                highlightedField === 'coordinador'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <label className="section-label text-text-dim flex items-center gap-1.5">
                                    <User size={12} /> Coordinador Responsable
                                </label>
                                {renderFieldFeedbackButton('coordinador', 'Coordinador Responsable')}
                            </div>
                            <p className="text-sm font-semibold text-text-main flex items-center gap-2">
                                <span>{detailGroup.nombre_coordinador ? formatNombre(detailGroup.nombre_coordinador) : 'No asignado'}</span>
                                {detailGroup.telefono_coordinador && (
                                    <a
                                        href={formatWhatsappLink(detailGroup.telefono_coordinador)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                                        title={`Escribir por WhatsApp a ${detailGroup.nombre_coordinador}`}
                                    >
                                        <MessageCircle size={12} />
                                    </a>
                                )}
                            </p>
                            {detailGroup.id_profesor_coordinador && (
                                <p className="text-[10px] font-mono text-text-dim">C.I. {detailGroup.id_profesor_coordinador}</p>
                            )}
                        </div>

                        {/* Domain */}
                        {detailGroup.id_dominio && (
                            <div className="bento-card static p-4 space-y-2">
                                <label className="section-label text-text-dim">Dominio Académico</label>
                                <p className="text-xs font-semibold text-text-main">
                                    {dominios.find(d => d.id_dominio === detailGroup.id_dominio)?.nombre || 'Sin dominio'}
                                </p>
                            </div>
                        )}

                        {/* Objective */}
                        {detailGroup.objetivo_general && (
                            <div
                                id="field-container-objetivo"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'objetivo'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Objetivo General</label>
                                    {renderFieldFeedbackButton('objetivo', 'Objetivo General')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.objetivo_general}</p>
                            </div>
                        )}

                        {/* Mission */}
                        {detailGroup.mision && (
                            <div
                                id="field-container-mision"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'mision'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Misión</label>
                                    {renderFieldFeedbackButton('mision', 'Misión')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.mision}</p>
                            </div>
                        )}

                        {/* Vision */}
                        {detailGroup.vision && (
                            <div
                                id="field-container-vision"
                                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'vision'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim">Visión</label>
                                    {renderFieldFeedbackButton('vision', 'Visión')}
                                </div>
                                <p className="text-sm text-text-main leading-relaxed">{detailGroup.vision}</p>
                            </div>
                        )}

                        {/* Resolution & Dates */}
                        {(detailGroup.resolucion_aprobacion || detailGroup.fecha_creacion) && (
                            <div className="grid grid-cols-2 gap-4">
                                {detailGroup.resolucion_aprobacion && (
                                    <div className="bento-card static p-4 space-y-1">
                                        <label className="section-label text-text-dim">Resolución</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{detailGroup.resolucion_aprobacion}</p>
                                    </div>
                                )}
                                {detailGroup.fecha_creacion && (
                                    <div className="bento-card static p-4 space-y-1">
                                        <label className="section-label text-text-dim">Fecha Creación</label>
                                        <p className="text-sm font-bold text-text-main font-mono">{new Date(detailGroup.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Lines of Research */}
                        {detailGroup.lineas_ids && detailGroup.lineas_ids.length > 0 && (
                            <div
                                id="field-container-lineas"
                                className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'lineas'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim flex items-center gap-1">
                                        <BookOpen size={12} /> Líneas de Investigación
                                    </label>
                                    {renderFieldFeedbackButton('lineas', 'Líneas de Investigación')}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {detailGroup.lineas_ids.map(lineId => {
                                        const line = lines.find(l => l.id === lineId);
                                        if (!line) return null;
                                        return (
                                            <span key={lineId} className="text-xs font-bold text-text-main uppercase tracking-tight bg-bg-deep border border-border-thin rounded-xl p-2.5">
                                                {line.nombre}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Careers */}
                        {detailGroup.carreras_ids && detailGroup.carreras_ids.length > 0 && (
                            <div
                                id="field-container-carreras"
                                className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                    highlightedField === 'carreras'
                                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                        : ''
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <label className="section-label text-text-dim flex items-center gap-1">
                                        <GraduationCap size={12} /> Carreras / Programas
                                    </label>
                                    {renderFieldFeedbackButton('carreras', 'Carreras / Programas')}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {detailGroup.carreras_ids.map(carrId => {
                                        const career = carreras.find(c => c.id_carrera === carrId);
                                        if (!career) return null;
                                        return (
                                            <span key={carrId} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                                                {formatCareerName(career.carrera1)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Detailed Members Lists */}
                        <div
                            id="field-container-integrantes"
                            className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                                highlightedField === 'integrantes'
                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center border-b border-border-thin/20 pb-2 mb-2">
                                <label className="section-label text-text-dim flex items-center gap-1">
                                    <Users size={12} /> Integrantes del Grupo
                                </label>
                                {renderFieldFeedbackButton('integrantes', 'Integrantes del Grupo')}
                            </div>

                            {detailMembers.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Docentes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                                            <User size={10} />
                                            <span>Docentes Investigadores ({teachers.length})</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {teachers.map(member => (
                                                <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-emerald-500/10">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                            <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                                {member.rol}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {member.cedula && (
                                                        <div className="flex items-center gap-2">
                                                            {member.telefono_contacto && (
                                                                <a
                                                                    href={formatWhatsappLink(member.telefono_contacto)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                                                                    title={`Escribir por WhatsApp a ${member.nombre_completo}`}
                                                                >
                                                                    <MessageCircle size={10} />
                                                                </a>
                                                            )}
                                                            <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {teachers.length === 0 && (
                                                <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin docentes investigadores</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Estudiantes */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-400">
                                            <GraduationCap size={10} />
                                            <span>Estudiantes Semilleristas ({students.length})</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {students.map(member => (
                                                <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-blue-500/10">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                            <GraduationCap size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                            <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                                {member.rol}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {member.cedula && (
                                                        <div className="flex items-center gap-2">
                                                            {member.telefono_contacto && (
                                                                <a
                                                                    href={formatWhatsappLink(member.telefono_contacto)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                                                                    title={`Escribir por WhatsApp a ${member.nombre_completo}`}
                                                                >
                                                                    <MessageCircle size={10} />
                                                                </a>
                                                            )}
                                                            <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {students.length === 0 && (
                                                <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin estudiantes semilleristas</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Users size={20} className="mx-auto text-text-dim/30 mb-2" />
                                    <p className="text-[10px] text-text-dim font-medium uppercase tracking-widest">Sin integrantes registrados</p>
                                </div>
                            )}
                        </div>
                        </div>
                        )}
                    </div>
                )}

                {detailTab === 'proyectos' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-deep/5 custom-scrollbar">
                        {(() => {
                            const projectList = projectsList;
                            if (projectList.length === 0) {
                                return (
                                    <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center h-full">
                                        <div className="p-4 bg-surface rounded-full border border-border-thin mb-4">
                                            <BookOpen size={24} className="text-text-dim" />
                                        </div>
                                        <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">Sin proyectos adscritos</p>
                                        <p className="text-[9px] text-text-dim/80 mt-1 max-w-[220px] leading-relaxed uppercase font-mono text-center">
                                            Este grupo de investigación no cuenta con proyectos de investigación adscritos registrados.
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-3.5">
                                    {projectList.map((p: any, idx: number) => {
                                        const projectUuid = p.uuid || p.Uuid;
                                        const projectTitulo = p.titulo || p.Titulo || '(Sin título)';
                                        const projectEstado = p.estado || p.Estado || 'Borrador';
                                        const projectCodigo = p.codigo_institucional || p.codigoConversional || p.codigo_proyecto || p.codigoProyecto || p.CodigoInstitucional || 'N/A';
                                        const projectDirector = p.director_nombre || p.directorNombre || p.DirectorNombre || 'No asignado';
                                        
                                        const getStatusColor = (status: string) => {
                                            switch (status?.toLowerCase()) {
                                                case 'aprobado': return 'badge-vercel-success';
                                                case 'borrador': return 'badge-vercel-neutral';
                                                case 'pendiente': return 'badge-vercel-warning';
                                                case 'en evaluacion':
                                                case 'en evaluación': return 'badge-vercel-info';
                                                case 'rechazado': return 'badge-vercel-error';
                                                default: return 'badge-vercel-info';
                                            }
                                        };

                                        const workspaceLink = `/investigacion/workspace/protocolo-investigacion/${projectUuid}`;

                                        return (
                                            <div key={projectUuid || idx} className="bento-card static p-5 flex flex-col justify-between hover:border-border-hover hover:bg-surface-hover/10 transition-all duration-300 animate-fade-in">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
                                                            {projectCodigo}
                                                        </span>
                                                        <span className={`badge-vercel ${getStatusColor(projectEstado)} text-[9px] font-bold uppercase`}>
                                                            {projectEstado}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-semibold text-text-main leading-snug line-clamp-2 uppercase">
                                                        {projectTitulo}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-text-dim mt-1.5">
                                                        <span className="font-bold">Director:</span>
                                                        <span className="font-mono text-text-main truncate max-w-[200px]" title={projectDirector}>
                                                            {formatNombre(projectDirector)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-border-thin/20 flex justify-end">
                                                    <a 
                                                        href={workspaceLink}
                                                        className="px-3.5 py-1.5 bg-text-main text-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-95 transition-all flex items-center gap-1 shadow-md"
                                                    >
                                                        <span>Espacio de Trabajo</span>
                                                        <ChevronRight size={10} />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {isMember && detailTab === 'feedback' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-bg-deep/10 h-full">
                        {/* Timelines and observations */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loadingFeedback ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-70 h-full">
                                    <Loader2 size={24} className="animate-spin text-text-main" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Cargando buzón oficial...</span>
                                </div>
                            ) : feedbackComments.length === 0 ? (
                                <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center h-full">
                                    <div className="p-4 bg-surface rounded-full border border-border-thin mb-4">
                                        <MessageSquare size={24} className="text-text-dim" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">Sin observaciones registradas</p>
                                    <p className="text-[9px] text-text-dim/80 mt-1 max-w-[220px] leading-relaxed uppercase font-mono text-center">
                                        No hay historial en el canal. El evaluador y el equipo pueden iniciar la comunicación aquí.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedbackComments.map((c, i) => {
                                        let isAudio = false;
                                        let audioData = null;
                                        let isFieldFeedback = false;
                                        let fieldFeedbackData = null;
                                        try {
                                            if (c.contenido.startsWith('{')) {
                                                const parsed = JSON.parse(c.contenido);
                                                if (parsed.type === 'field_feedback') {
                                                    isFieldFeedback = true;
                                                    fieldFeedbackData = parsed;
                                                } else if (parsed.type === 'audio') {
                                                    isAudio = true;
                                                    audioData = parsed;
                                                }
                                            }
                                        } catch (e) {}

                                        const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                        const isMe = c.usuarioUuid === user?.id_referencia;

                                        if (isFieldFeedback && fieldFeedbackData) {
                                            return (
                                                <div 
                                                    key={c.idComentario || i} 
                                                    className={`flex flex-col w-full max-w-[90%] ${
                                                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                    } animate-fade-up`}
                                                >
                                                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                            isMe
                                                                ? 'text-emerald-400'
                                                                : isMsgFromAdmin
                                                                    ? 'text-amber-400'
                                                                    : 'text-brand-light'
                                                        }`}>
                                                            {isMe ? 'Tú' : c.nombreUsuario} (Retroalimentación de Campo)
                                                        </span>
                                                        <span className="text-[8px] text-text-dim font-mono">
                                                            {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>

                                                    <div className={`rounded-xl p-4 border shadow-sm w-full select-text transition-all duration-300 ${
                                                        isMe
                                                            ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/30'
                                                            : isMsgFromAdmin
                                                                ? 'bg-amber-500/[0.03] border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/30'
                                                                : 'bg-brand/[0.03] border-brand/20 text-text-main rounded-tl-none hover:border-brand/30'
                                                    }`}>
                                                        <div className="flex items-center justify-between border-b border-border-thin/20 pb-2 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle size={12} className={isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand-light'} />
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                                    isMe ? 'text-emerald-400' : isMsgFromAdmin ? 'text-amber-400' : 'text-brand-light'
                                                                }`}>
                                                                    Observación: {fieldFeedbackData.fieldName || fieldFeedbackData.field}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setDetailTab('info');
                                                                    setHighlightedField(fieldFeedbackData.field);
                                                                    setTimeout(() => {
                                                                        const element = document.getElementById(`field-container-${fieldFeedbackData.field}`);
                                                                        if (element) {
                                                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }
                                                                    }, 300);
                                                                    setTimeout(() => {
                                                                        setHighlightedField(null);
                                                                    }, 3500);
                                                                }}
                                                                className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-border-thin bg-surface-hover hover:border-border-hover text-text-dim active:scale-95 transition-all"
                                                            >
                                                                Ver Campo
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {fieldFeedbackData.text && <p className="text-[11px] font-medium leading-relaxed">{fieldFeedbackData.text}</p>}
                                                            {fieldFeedbackData.audioUrl && (
                                                                <div className="mt-1">
                                                                    <AudioBubblePlayer src={fieldFeedbackData.audioUrl} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div 
                                                key={c.idComentario || i} 
                                                className={`flex flex-col w-full max-w-[80%] ${
                                                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                                } animate-fade-up`}
                                            >
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                        isMe
                                                            ? 'text-emerald-400'
                                                            : isMsgFromAdmin
                                                                ? 'text-amber-400'
                                                                : 'text-brand-light'
                                                    }`}>
                                                        {isMe ? 'Tú' : c.nombreUsuario}
                                                    </span>
                                                    <span className="text-[8px] text-text-dim font-mono">
                                                        {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div className={`rounded-xl p-4 border shadow-sm select-text transition-all duration-300 ${
                                                    isMe
                                                        ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/30'
                                                        : isMsgFromAdmin
                                                            ? 'bg-amber-500/[0.03] border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/30'
                                                            : 'bg-brand/[0.03] border-brand/20 text-text-main rounded-tl-none hover:border-brand/30'
                                                }`}>
                                                    {isAudio && audioData ? (
                                                        <div className="space-y-2">
                                                            {audioData.text && <p className="text-[11px] font-medium leading-relaxed">{audioData.text}</p>}
                                                            <div className="mt-1">
                                                                <AudioBubblePlayer src={audioData.audioUrl} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] font-medium leading-relaxed">{c.contenido}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Live collaborative chat Input */}
                        <div className="p-4 border-t border-border-thin bg-surface-hover/30 shrink-0 space-y-3">
                            {isRecording ? (
                                <div className="flex items-center justify-between bg-red-500/5 border border-red-500/25 rounded-xl p-2 px-3 animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                        <span className="text-[8px] font-black uppercase text-red-400 tracking-wider font-mono">
                                            Grabando ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            className="px-1.5 py-0.5 hover:bg-surface border border-border-thin rounded text-[8px] font-bold uppercase tracking-widest text-text-dim transition-all"
                                        >
                                            x
                                        </button>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                                        >
                                            ok
                                        </button>
                                    </div>
                                </div>
                            ) : audioUrl ? (
                                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 animate-fade-in">
                                    <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                                        <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Audio grabado</span>
                                        <AudioBubblePlayer src={audioUrl} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                        className="px-1.5 py-0.5 hover:bg-red-500/10 rounded text-[8px] font-bold uppercase tracking-widest text-red-500 transition-all shrink-0"
                                    >
                                        Descartar
                                    </button>
                                </div>
                            ) : null}

                            <div className="flex items-end gap-2 relative">
                                <textarea
                                    value={newFeedbackText}
                                    onChange={(e) => setNewFeedbackText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendFeedbackMessage(detailGroup.uuid);
                                        }
                                    }}
                                    placeholder="Escriba observaciones de retroalimentación oficial..."
                                    className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-3 pr-16 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-16 transition-all custom-scrollbar placeholder:text-text-dim/60 font-medium"
                                />

                                <div className="absolute right-2 bottom-2 flex gap-1">
                                    {!audioUrl && (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="p-1.5 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                            title="Grabar Audio Explicativo"
                                        >
                                            <Mic size={14} />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                        onClick={() => handleSendFeedbackMessage(detailGroup.uuid)}
                                        className="p-1.5 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                    >
                                        {sendingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-footer shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="btn-vercel-secondary"
                                disabled={savingInline}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveInlineChanges}
                                className="btn-vercel-primary flex items-center gap-2"
                                disabled={savingInline}
                            >
                                {savingInline ? <Loader2 size={12} className="animate-spin" /> : null}
                                <span>Guardar Cambios</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="btn-vercel-secondary">Cerrar</button>
                            {isAdmin && detailGroup.estado === 'Pendiente' && (
                                <button
                                    onClick={() => handleOpenReview(detailGroup)}
                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 shrink-0"
                                >
                                    Evaluar Propuesta
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
);
};
