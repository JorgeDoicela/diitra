/**
 * Barrel exports — core/clipboard
 *
 * Uso recomendado:
 *   import { BlockClipboardWrapper, usePromptClipboard, buildClipboardPayload } from '@/core/clipboard';
 *   (o con ruta relativa según la configuración de paths de Vite/TS)
 */

// Tipos públicos
export type { PromptClipboardContextData, CopyMode } from './types/promptClipboard.types';

// Hook de portapapeles
export { usePromptClipboard } from './hooks/usePromptClipboard';

// Componentes
export { BlockClipboardWrapper } from './components/BlockClipboardWrapper';
export { PromptContextMenu } from './components/PromptContextMenu';

// Utilidades del motor (útiles para tests o consumo externo)
export {
    buildClipboardPayload,
    buildFullDocumentMarkdown,
    formatStructuredCollection,
    resolveContentString,
    stripHtml,
} from './utils/promptClipboardEngine';

// Registro centralizado de metadatos y serializadores por sección
export {
    getSectionClipboardMeta,
    serializeGeneralSection,
    serializeTeamSection,
    serializeTechnicalSection,
    serializeBudgetSection,
    serializeExpectedProducts,
    serializeImpacts,
    serializeTimeline,
    serializeBibliography,
} from './registry/sectionClipboardRegistry';
export type { SectionClipboardMeta } from './registry/sectionClipboardRegistry';
