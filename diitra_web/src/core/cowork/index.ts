// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Public API (index.ts)
//
// Este archivo es el ÚNICO punto de importación para el resto del sistema.
// Nunca importar desde archivos internos del core directamente.
//
// ✅ CORRECTO:
//   import { useCoWork, CoWorkEditor, coworkUserFromAuth } from '@/core/cowork';
//
// ❌ INCORRECTO:
//   import { useCoWork } from '@/core/cowork/hooks/useCoWork';
//
// Esta convención garantiza que el nucleo sea completamente refactorizable
// sin afectar al código que lo consume.
// ═══════════════════════════════════════════════════════════════════

// ── Hook principal ──
export { useCoWork } from './hooks/useCoWork';

// ── Componente de editor colaborativo (Tiptap + Yjs) ──
export { CoWorkEditor } from './components/CoWorkEditor';

// ── Adaptador de autenticación (DIITRA Auth → CoWork User) ──
export { coworkUserFromAuth } from './utils/coworkUserFromAuth';
export type { DiitraAuthData } from './utils/coworkUserFromAuth';

// ── Tipos públicos ──
export type {
    CoWorkUser,
    CoWorkSession,
    CoWorkConfig,
    CoWorkHandle,
} from './types';

// ── Interfaz del transporte (para crear transportes alternativos) ──
export type { ICoWorkTransport } from './transport/ICoWorkTransport';

// ── Utilidades de configuración ──
export { getUserColor, getUserInitials, COWORK_CONFIG } from './config';
