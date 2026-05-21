// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — NoOpCoWork Factory
//
// Implementación vacía (Null Object Pattern) del CoWorkHandle.
// Permite usar el DIITRABuilderShell en documentos que NO necesitan
// colaboración en tiempo real (ej: informes internos, actas de uso exclusivo
// del Director de Investigación, reportes CACES de solo lectura).
//
// Uso:
// ────
// import { createNoOpCoWork } from '@/core/cowork';
//
// const cowork = createNoOpCoWork();
// <DIITRABuilderShell cowork={cowork} ... />
//
// Garantía: Esta función NUNCA abre una conexión WebSocket ni consume
// recursos del servidor de SignalR. Es completamente segura de usar en
// contextos offline, tests unitarios y previsualizaciones estáticas.
// ═══════════════════════════════════════════════════════════════════

import type { CoWorkHandle, CoWorkSession } from './types';

const DISCONNECTED_SESSION: CoWorkSession = {
    documentId: 'noop',
    isConnected: false,
    connectedUsers: [],
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    readOnly: false,
    isBlindMode: false,
};

/**
 * Crea un CoWorkHandle que no hace absolutamente nada.
 * Implementa el patrón Null Object para el contrato CoWorkHandle.
 *
 * @param documentId - ID de sala (solo para trazabilidad en logs, no se usa)
 */
export function createNoOpCoWork(documentId = 'noop'): CoWorkHandle {
    const session: CoWorkSession = { ...DISCONNECTED_SESSION, documentId };

    return {
        session,
        ydoc: null,
        awareness: null,

        // Operaciones de ciclo de vida — no-ops seguros
        disconnect: () => { /* no-op */ },
        compact: () => Promise.resolve(),
        submitFinalContent: (_html: string, _json: string) => { /* no-op */ },

        // Coordinación Team Pulse — retornan promesas resueltas
        notifySectionActivity: (_uuid, _section, _action) => Promise.resolve(),
        updateSectionStatus: (_uuid, _section, _status) => Promise.resolve(),
        postComment: (_uuid, _content, _parentId?) => Promise.resolve(),

        // Suscripciones en tiempo real — no-ops seguros
        onSectionActivity: (_handler) => { /* no-op */ },
        onSectionStatusUpdated: (_handler) => { /* no-op */ },
        onNewCommentReceived: (_handler) => { /* no-op */ },
    };
}
