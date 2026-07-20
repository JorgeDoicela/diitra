import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';
import { useRevisionTecnicaLayout } from './useRevisionTecnicaLayout';
import { useRevisionTecnicaComments } from './useRevisionTecnicaComments';
import { useRevisionTecnicaData } from './useRevisionTecnicaData';

export const useRevisionTecnica = () => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const navigate = useNavigate();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const layout = useRevisionTecnicaLayout();
    const commentsState = useRevisionTecnicaComments({
        projectUuid,
        activeCommentField: layout.activeCommentField,
        addToast
    });
    const data = useRevisionTecnicaData({
        projectUuid,
        navigate,
        addToast,
        confirm,
        comments: commentsState.comments,
        setComments: commentsState.setComments,
        activeCommentField: layout.activeCommentField,
        setContextualInput: commentsState.setContextualInput
    });

    // Auto-Scroll suave a la tarjeta seleccionada en el visor interactivo
    useEffect(() => {
        if (!layout.activeCommentField || layout.viewMode === 'pdf') return;
        const targetElement = document.getElementById(`field-card-${layout.activeCommentField}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [layout.activeCommentField, layout.viewMode]);

    const getSafeArray = (value: any): any[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch {}
        }
        return [];
    };

    const getFieldCardClasses = (fieldKey: string, extraClasses: string = 'space-y-1') => {
        const isActive = layout.activeCommentField === fieldKey && layout.isRightSidebarOpen;
        const borderClass = 'border-border-thin bg-surface';
        const activeClass = isActive
            ? '!border-brand/45 bg-brand/[0.003] shadow-[0_4px_20px_rgba(99,102,241,0.04)] ring-1 ring-brand/5 scale-[1.002]'
            : '';

        return `p-4 rounded-xl border ${extraClasses} relative cursor-pointer hover:bg-surface-hover/80 active:scale-[0.99] transition-all duration-200 ${borderClass} ${activeClass}`;
    };

    const renderFieldStatusBadge = (_fieldKey: string) => {
        return null;
    };

    return {
        projectUuid,
        navigate,
        layout,
        commentsState,
        data,
        getSafeArray,
        getFieldCardClasses,
        renderFieldStatusBadge
    };
};
