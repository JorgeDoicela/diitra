import React, { useEffect } from 'react';
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

    const renderFieldStatusBadge = (fieldKey: string) => {
        const fieldComments = commentsState.comments[fieldKey];
        if (fieldComments && fieldComments.length > 0) {
            return React.createElement(
                'span',
                { className: 'inline-flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider' },
                React.createElement('span', { className: 'w-1 h-1 rounded-full bg-amber-500 animate-pulse' }),
                `Con Observaciones (${fieldComments.length})`
            );
        }
        return null;
    };

    const handleNavigateBack = () => {
        if (commentsState.contextualInput.trim()) {
            if (!window.confirm('Tiene una observación en borrador sin enviar en el panel lateral. ¿Desea salir sin guardar?')) {
                return;
            }
        }
        navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}`);
    };

    return {
        projectUuid,
        navigate,
        layout,
        commentsState,
        data,
        getSafeArray,
        getFieldCardClasses,
        renderFieldStatusBadge,
        handleNavigateBack
    };
};
