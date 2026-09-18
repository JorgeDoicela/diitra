import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../api/AuthContext';
import { useNotifications } from '../../../api/NotificationsContext';
import type { FeedbackReporte, FeedbackMensaje } from '../../../services/feedbackService';

interface SeenRecord {
    lastSeenMessageId?: string;
    lastSeenTimestamp: number;
    totalSeenCount: number;
}

type SeenMap = Record<number, SeenRecord>;

export const useFeedbackUnreadMessages = (isAdmin = false) => {
    const { user } = useAuth();
    const { notifications, markAsRead } = useNotifications();

    const storageKey = useMemo(() => {
        const userKey = user?.id_usuario || user?.cedula || (isAdmin ? 'admin' : 'user');
        return `diitra_feedback_seen_threads_${userKey}`;
    }, [user?.id_usuario, user?.cedula, isAdmin]);

    const [seenMap, setSeenMap] = useState<SeenMap>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    // Sincronizar storage si cambia el usuario activo
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            setSeenMap(raw ? JSON.parse(raw) : {});
        } catch {
            setSeenMap({});
        }
    }, [storageKey]);

    // Comprueba si un mensaje fue redactado por el usuario actual
    const isOwnMessage = useCallback((msg: FeedbackMensaje): boolean => {
        const msgUserId = msg.id_usuario ?? msg.idUsuario;
        const currentUserId = user?.id_usuario;
        if (currentUserId && msgUserId && Number(msgUserId) === Number(currentUserId)) {
            return true;
        }

        const currentName = (user?.nombre_completo || '').trim().toLowerCase();
        const authorName = (msg.nombre_autor || msg.nombreAutor || '').trim().toLowerCase();
        if (currentName && authorName && currentName === authorName) {
            return true;
        }

        // Si soy admin y el mensaje fue enviado como admin
        if (isAdmin && (msg.es_admin ?? msg.esAdmin) && (!msgUserId || msgUserId === currentUserId)) {
            return true;
        }

        return false;
    }, [user?.id_usuario, user?.nombre_completo, isAdmin]);

    // Calcula cuántos mensajes entrantes no leídos tiene un reporte
    const getUnreadCount = useCallback((report: FeedbackReporte): number => {
        const reportId = report.id_feedback || report.idFeedback;
        if (!reportId) return 0;

        const conversacion = report.conversacion || [];
        if (conversacion.length === 0) return 0;

        // Filtrar mensajes entrantes (enviados por el otro interlocutor)
        const incomingMessages = conversacion.filter(msg => !isOwnMessage(msg));
        if (incomingMessages.length === 0) return 0;

        const seenRecord = seenMap[reportId];
        if (!seenRecord) {
            // Nunca ha abierto este hilo y hay mensajes entrantes
            return incomingMessages.length;
        }

        // Si existe el ID del último mensaje visto, contar los entrantes posteriores a ese índice
        if (seenRecord.lastSeenMessageId) {
            const lastIdx = conversacion.findIndex(m => m.id === seenRecord.lastSeenMessageId);
            if (lastIdx !== -1) {
                const afterMessages = conversacion.slice(lastIdx + 1);
                return afterMessages.filter(msg => !isOwnMessage(msg)).length;
            }
        }

        // Si no se localiza por ID, usar timestamp de último visto
        if (seenRecord.lastSeenTimestamp) {
            return incomingMessages.filter(m => {
                const msgTime = new Date(m.fecha).getTime();
                return !isNaN(msgTime) && msgTime > seenRecord.lastSeenTimestamp;
            }).length;
        }

        return 0;
    }, [seenMap, isOwnMessage]);

    // Marca un reporte específico como leído (elimina el badge rojo)
    const markReportAsRead = useCallback((reportId: number, messages?: FeedbackMensaje[]) => {
        if (!reportId) return;

        const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;

        setSeenMap(prev => {
            const updated: SeenMap = {
                ...prev,
                [reportId]: {
                    lastSeenMessageId: lastMsg?.id,
                    lastSeenTimestamp: Date.now(),
                    totalSeenCount: messages?.length || 0
                }
            };

            try {
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch (err) {
                console.warn('No se pudo guardar visto de conversación en localStorage:', err);
            }

            return updated;
        });

        // Sincronizar y marcar como leídas las notificaciones correspondientes en la campanita
        if (notifications && notifications.length > 0) {
            const pendingNotifs = notifications.filter(n => 
                !n.leido && (
                    (n.url_accion && (n.url_accion.includes(`id=${reportId}`) || n.url_accion === '/incidencias' || n.url_accion === '/admin/incidencias')) ||
                    n.categoria === 'SOPORTE'
                )
            );

            pendingNotifs.forEach(n => {
                try {
                    markAsRead(n.uuid);
                } catch {}
            });
        }
    }, [storageKey, notifications, markAsRead]);

    return {
        getUnreadCount,
        markReportAsRead
    };
};
