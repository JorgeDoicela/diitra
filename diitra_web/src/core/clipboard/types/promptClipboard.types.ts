/**
 * Tipos para el sistema de Portapapeles Estructurado y Asistencia Técnica
 */

export interface PromptClipboardContextData {
    /** Título oficial de la sección o bloque */
    sectionTitle?: string;
    /** Clave del campo en formData o Yjs */
    fieldKey?: string;
    /** Tipo de bloque de plantilla (p. ej. 'rich_text', 'expected_products', 'impacts', etc.) */
    blockType?: string;
    /** Código de plantilla oficial (p. ej. 'PROTOCOLO_INVESTIGACION', 'PLAN_APRENDIZAJE') */
    templateCode?: string;
    /** Instrucciones oficiales de la plantilla */
    instructions?: string;
    /** Requisitos específicos (ej. extensión, citas APA) */
    requirementText?: string;
    /** Contenido actual del bloque en texto plano, HTML o estructura de datos */
    currentContent?: unknown;
    /**
     * Serializador explícito para convertir `currentContent` a string legible para IA.
     * Si se provee, tiene precedencia sobre la detección heurística de `formatStructuredCollection`.
     * Úsalo siempre que el contenido sea un array de objetos con estructura propia.
     *
     * @example
     *   contentSerializer={(items) => items.map((i) => `• ${i.descripcion}`).join('\n')}
     */
    contentSerializer?: (data: unknown) => string;
    /** Datos adicionales para bloques específicos */
    customData?: unknown;
    /** Metadatos globales del proyecto (Título, Carrera, Línea, etc.) */
    projectMetadata?: {
        titulo?: string;
        codigo?: string;
        carrera?: string;
        lineaInvestigacion?: string;
        tipoInvestigacion?: string;
    };
    /** Rol del usuario en el flujo actual: autor/investigador o revisor/auditor técnico */
    role?: 'author' | 'reviewer';
}

export type CopyMode = 
    | 'structured'       // Copiar estructurado con criterios institucionales y borrador
    | 'clean_content'    // Copiar solo el texto redactado por el docente
    | 'instructions'     // Copiar solo la consigna y requisitos de acreditación
    | 'project_summary'  // Copiar el resumen general del proyecto
    | 'full_document';   // Copiar el documento institucional completo estructurado

