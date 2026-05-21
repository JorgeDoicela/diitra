// ═══════════════════════════════════════════════════════════════════
// DIITRA — Document Component Registry
//
// Mapeo de IDs de sección → Componentes React.
//
// ¿Por qué existe este archivo separado?
// ──────────────────────────────────────
// El DocumentTemplateRegistry define los ESQUEMAS de datos (qué campos
// existen, qué listas, qué schema inicial). Es puro JSON — puede usarse
// en tests, en el backend, o en cualquier contexto no-React.
//
// Este archivo es el que trae los componentes de React al sistema.
// Solo se importa en contextos donde React está disponible.
//
// Extensión:
// ─────────────────────────────────────────────────────────────────
// Para agregar un nuevo documento con secciones personalizadas:
//   1. Define el schema en DocumentTemplateRegistry.ts
//   2. Crea tu componente de sección (ej: ActaSection.tsx)
//   3. Registra el id de la sección aquí
//
// Si NO registras un id aquí, se usa AgnosticSection como fallback automático.
// ═══════════════════════════════════════════════════════════════════

import { GeneralSection }         from '../../../components/DIITRA/sections/GeneralSection';
import { TechnicalSection }       from '../../../components/DIITRA/sections/TechnicalSection';
import { TeamSection }            from '../../../components/DIITRA/sections/TeamSection';
import { BudgetSection }          from '../../../components/DIITRA/sections/BudgetSection';
import { TimelineSection }        from '../../../components/DIITRA/sections/TimelineSection';
import { ImpactSection }          from '../../../components/DIITRA/sections/ImpactSection';
import { ProgressReportSection }  from '../../../components/DIITRA/sections/ProgressReportSection';
import { AgnosticSection }        from '../../../components/DIITRA/sections/AgnosticSection';

/**
 * Mapa de ID de sección → componente React específico.
 * Clave: ID de sección tal como se define en DocumentTemplateRegistry.ts
 * Valor: Componente React de sección
 */
export const DocumentComponentRegistry: Record<string, React.ComponentType<any>> = {
    // ── PROTOCOLO DE INVESTIGACIÓN ─────────────────────────────────
    'identificacion': GeneralSection,
    'tecnico':        TechnicalSection,
    'equipo':         TeamSection,
    'recursos':       BudgetSection,
    'cronograma':     TimelineSection,
    'impactos':       ImpactSection,

    // ── INFORME DE AVANCE ─────────────────────────────────────────
    'ejecucion':      ProgressReportSection,

    // ── SECCIONES AGNÓSTICAS (documentos dinámicos del backend) ───
    // 'evaluacion', 'resumen', 'resultados', 'impacto' etc. →
    // Usarán AgnosticSection por defecto (ver getDocumentSection)
};

/**
 * Resuelve el componente React correcto para una sección dada.
 * Si no existe un componente específico, devuelve AgnosticSection.
 *
 * @param sectionId - ID de la sección (ej: 'identificacion', 'tecnico')
 * @param overrideComponent - Componente definido directamente en la config de la sección (compat legacy)
 */
export function getDocumentSection(
    sectionId: string,
    overrideComponent?: React.ComponentType<any>
): React.ComponentType<any> {
    // Prioridad 1: Componente explícito en la config de la sección (retrocompatibilidad)
    if (overrideComponent) return overrideComponent;
    // Prioridad 2: Registro explícito
    if (DocumentComponentRegistry[sectionId]) return DocumentComponentRegistry[sectionId];
    // Fallback: AgnosticSection para secciones dinámicas del backend
    return AgnosticSection;
}

// Necesario para el tipado del import
import type React from 'react';
