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
import { ExpectedProductsSection } from '../../../components/DIITRA/sections/ExpectedProductsSection';
import { BibliographySection }    from '../../../components/DIITRA/sections/BibliographySection';
import { ProgressReportSection }  from '../../../components/DIITRA/sections/ProgressReportSection';
import { FinalReportHeaderSection } from '../../../components/DIITRA/sections/FinalReportHeaderSection';
import { AgnosticSection }        from '../../../components/DIITRA/sections/AgnosticSection';
import { MultiSectionTableSection } from '../../../components/DIITRA/sections/MultiSectionTableSection';
import { LearningPlanSection } from '../../../components/DIITRA/sections/LearningPlanSection';

/**
 * Mapa de nombre string de componente → Componente React real
 */
export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
    'GeneralSection': GeneralSection,
    'TeamSection': TeamSection,
    'TechnicalSection': TechnicalSection,
    'BudgetSection': BudgetSection,
    'ImpactSection': ImpactSection,
    'ExpectedProductsSection': ExpectedProductsSection,
    'TimelineSection': TimelineSection,
    'BibliographySection': BibliographySection,
    'ProgressReportSection': ProgressReportSection,
    'FinalReportHeaderSection': FinalReportHeaderSection,
    'AgnosticSection': AgnosticSection,
    'MultiSectionTableSection': MultiSectionTableSection,
    'LearningPlanSection': LearningPlanSection
};

/**
 * Mapa de ID de sección → componente React específico.
 * Clave: ID de sección tal como se define en DocumentTemplateRegistry.ts
 * Valor: Componente React de sección
 */
export const DocumentComponentRegistry: Record<string, React.ComponentType<any>> = {
    // ── PROTOCOLO DE INVESTIGACIÓN ─────────────────────────────────
    'identificacion': GeneralSection,
    'datos_generales_informe_final': FinalReportHeaderSection,
    'equipo':         TeamSection,
    'tecnico':        TechnicalSection,
    'recursos':       BudgetSection,
    'impactos':       ImpactSection,
    'productos_esperados': ExpectedProductsSection,
    'cronograma':     TimelineSection,
    'bibliografia':   BibliographySection,
    'plan_aprendizaje': LearningPlanSection,
    'evaluacion_plan_aprendizaje': LearningPlanSection,
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
    // Prioridad 2: Resolución por nombre de componente
    if (COMPONENT_MAP[sectionId]) return COMPONENT_MAP[sectionId];
    // Prioridad 3: Registro explícito por ID
    if (DocumentComponentRegistry[sectionId]) return DocumentComponentRegistry[sectionId];
    // Prioridad 4: Prefijos dinámicos de bloques conocidos
    if (sectionId && typeof sectionId === 'string' && sectionId.startsWith('multi_section_table')) {
        return MultiSectionTableSection;
    }
    // Fallback: AgnosticSection para secciones dinámicas del backend
    return AgnosticSection;
}

// Necesario para el tipado del import
import type React from 'react';
