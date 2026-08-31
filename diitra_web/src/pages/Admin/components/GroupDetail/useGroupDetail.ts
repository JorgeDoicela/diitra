import { useState, useEffect, useRef } from 'react';
import api from '../../../../api/axios_config';
import { useConfirm } from '../../../../api/ConfirmContext';
import { useGroupAudioRecorder } from './hooks/useGroupAudioRecorder';
import { useGroupFeedbackSignalR } from './hooks/useGroupFeedbackSignalR';
import { useGroupEditDraft } from './hooks/useGroupEditDraft';
import { useGroupMemberSearch } from './hooks/useGroupMemberSearch';

// Re-export types from the canonical source to avoid circular deps
export type { Group, GroupMember, Career, ResearchLine } from '../GroupsPage/types';
import type { Group, GroupMember, Career, ResearchLine } from '../GroupsPage/types';

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

    // Base States
    const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
    const [detailTab, setDetailTab] = useState<'info' | 'documento' | 'feedback' | 'proyectos'>('info');
    const openTimeRef = useRef<number>(0);

    // Audio recorder sub-hook
    const audioRecorder = useGroupAudioRecorder();

    // Calculate Permissions
    const userRef = user?.id_referencia?.trim();
    const canEdit = detailGroup && (isAdmin || 
        (detailGroup.id_profesor_coordinador?.trim() === userRef && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación') ||
        (detailGroup.teacherMemberCedulas && detailGroup.teacherMemberCedulas.some((ced: string) => ced.trim() === userRef) && detailGroup.estado !== 'Aprobado' && detailGroup.estado !== 'En Evaluación'));

    const isMember = isAdmin || 
        (detailGroup && detailGroup.id_profesor_coordinador?.trim() === user?.id_referencia?.trim()) || 
        detailMembers.some(m => m.activo && (m.cedula?.trim() === user?.id_referencia?.trim() || m.cedula?.trim() === user?.cedula?.trim() || m.id_usuario === user?.id_usuario));

    // Refresh Detail
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

    // Feedback & SignalR sub-hook
    const feedback = useGroupFeedbackSignalR({
        isOpen,
        detailGroup,
        isMember,
        user,
        isAdmin,
        audioBlob: audioRecorder.audioBlob,
        setAudioBlob: audioRecorder.setAudioBlob,
        setAudioUrl: audioRecorder.setAudioUrl,
        confirm
    });

    // Form Edit & Draft sub-hook
    const draft = useGroupEditDraft({
        isOpen,
        detailGroup,
        isEditingInitial,
        fetchData,
        refreshGroupDetail,
        onClose,
        confirm,
        setIsFieldModalOpen: feedback.setIsFieldModalOpen,
        setActiveFieldKey: feedback.setActiveFieldKey
    });

    // Member search sub-hook
    const memberSearch = useGroupMemberSearch({
        detailGroup,
        detailMembers,
        carreras,
        setEditFormData: draft.setEditFormData,
        setSelectedCoordName: draft.setSelectedCoordName,
        refreshGroupDetail
    });

    // Fetch initial data effect
    useEffect(() => {
        if (!isOpen || !detailGroup?.uuid) return;
        openTimeRef.current = Date.now();
        setDetailTab('info');
        draft.setIsEditing(!!isEditingInitial);
        refreshGroupDetail();
    }, [isOpen, detailGroup?.uuid, isEditingInitial]);

    return {
        // States & refs
        detailMembers,
        setDetailMembers,
        detailTab,
        setDetailTab,
        feedbackComments: feedback.feedbackComments,
        loadingFeedback: feedback.loadingFeedback,
        newFeedbackText: feedback.newFeedbackText,
        setNewFeedbackText: feedback.setNewFeedbackText,
        sendingFeedback: feedback.sendingFeedback,
        editingCommentId: feedback.editingCommentId,
        setEditingCommentId: feedback.setEditingCommentId,
        editingCommentText: feedback.editingCommentText,
        setEditingCommentText: feedback.setEditingCommentText,
        isEditing: draft.isEditing,
        setIsEditing: draft.setIsEditing,
        savingInline: draft.savingInline,
        isDraftRestored: draft.isDraftRestored,
        editFormData: draft.editFormData,
        setEditFormData: draft.setEditFormData,
        selectedCoordName: draft.selectedCoordName,
        setSelectedCoordName: draft.setSelectedCoordName,
        selectedCoordCareer: memberSearch.selectedCoordCareer,
        activeFieldKey: feedback.activeFieldKey,
        setActiveFieldKey: feedback.setActiveFieldKey,
        activeFieldName: feedback.activeFieldName,
        setActiveFieldName: feedback.setActiveFieldName,
        isFieldModalOpen: feedback.isFieldModalOpen,
        setIsFieldModalOpen: feedback.setIsFieldModalOpen,
        highlightedField: feedback.highlightedField,
        setHighlightedField: feedback.setHighlightedField,
        isRecording: audioRecorder.isRecording,
        recordingTime: audioRecorder.recordingTime,
        audioUrl: audioRecorder.audioUrl,
        audioBlob: audioRecorder.audioBlob,
        setAudioBlob: audioRecorder.setAudioBlob,
        setAudioUrl: audioRecorder.setAudioUrl,

        // Computed
        canEdit,
        isMember,
        detailGroup,
        isAdmin,
        lines,

        // Actions
        handleSelectCoordinator: memberSearch.handleSelectCoordinator,
        handleAddMember: memberSearch.handleAddMember,
        handleRemoveMember: memberSearch.handleRemoveMember,
        toggleLine: draft.toggleLine,
        clearDraft: draft.clearDraft,
        handleCloseAttempt: draft.handleCloseAttempt,
        handleSaveInlineChanges: draft.handleSaveInlineChanges,
        startRecording: audioRecorder.startRecording,
        stopRecording: audioRecorder.stopRecording,
        cancelRecording: audioRecorder.cancelRecording,
        handleSendFeedbackMessage: feedback.handleSendFeedbackMessage,
        handleUpdateComment: feedback.handleUpdateComment,
        handleDeleteComment: feedback.handleDeleteComment,
        getFieldComments: feedback.getFieldComments,
        openFieldFeedbackDrawer: feedback.openFieldFeedbackDrawer,
        handleSendFieldFeedback: feedback.handleSendFieldFeedback,
        refreshGroupDetail
    };
};
