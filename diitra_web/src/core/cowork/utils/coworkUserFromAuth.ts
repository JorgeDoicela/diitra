// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Utility: coworkUserFromAuth
//
// Convierte los datos del AuthContext de DIITRA en un CoWorkUser.
// Este es el adaptador oficial para conectar DIITRA Auth con DIITRA CoWork.
// ═══════════════════════════════════════════════════════════════════

import { getUserColor, getUserInitials } from '../config';
import type { CoWorkUser } from '../types';

/**
 * Interfaz mínima que DIITRA CoWork necesita del contexto de autenticación.
 * Mapea los campos del JWT de DIITRA al formato interno de CoWork.
 */
export interface DiitraAuthData {
    userUuid: string;
    nombreCompleto: string;
    role: string;
}

/**
 * Convierte los datos del AuthContext en un CoWorkUser listo para usar.
 *
 * Uso en cualquier componente:
 * ─────────────────────────────
 * const auth = useAuth();
 * const cowork = useCoWork({
 *   documentId: proyecto.uuid,
 *   user: coworkUserFromAuth(auth),
 * });
 *
 * El color y las iniciales son derivados DETERMINÍSTICAMENTE del UUID,
 * garantizando que el mismo usuario tenga el mismo color en todas las
 * sesiones, en todos los dispositivos y sin necesitar estado extra.
 */
export function coworkUserFromAuth(auth: DiitraAuthData): CoWorkUser {
    return {
        id: auth.userUuid,
        name: auth.nombreCompleto,
        role: auth.role,
        color: getUserColor(auth.userUuid),
        initials: getUserInitials(auth.nombreCompleto),
    };
}
