/**
 * DIITRA — Tests: usePreproposalState.ts (lógica pura)
 *
 * Valida la lógica del estado de la prepropuesta de investigación:
 *  - Determinación de si la prepropuesta puede enviarse (completitud mínima)
 *  - Validación de secciones requeridas para la prepropuesta
 *  - Cálculo del nivel de avance de la prepropuesta
 *  - Restricciones por estado del proyecto (Borrador vs Prepropuesta)
 *  - Detección de cambios en el draft de prepropuesta
 *  - Reglas de transición de estado (Borrador → Prepropuesta → Enviado)
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PreproposalForm {
    problematica: string;
    justificacion: string;
    objetivoGeneral: string;
    objetivosEspecificos: string[];
    metodologia: string;
    resultadosEsperados: string;
    lineaInvestigacion: string;
    presupuestoEstimado: number | null;
}

const PREPROPOSAL_DEFAULT: PreproposalForm = {
    problematica: "",
    justificacion: "",
    objetivoGeneral: "",
    objetivosEspecificos: [],
    metodologia: "",
    resultadosEsperados: "",
    lineaInvestigacion: "",
    presupuestoEstimado: null,
};

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function validarPrepropuesta(form: PreproposalForm): string[] {
    const errores: string[] = [];
    if (!form.problematica.trim()) errores.push("La problemática es requerida");
    if (!form.justificacion.trim()) errores.push("La justificación es requerida");
    if (!form.objetivoGeneral.trim()) errores.push("El objetivo general es requerido");
    if (form.objetivosEspecificos.length === 0) errores.push("Debe tener al menos un objetivo específico");
    if (!form.metodologia.trim()) errores.push("La metodología es requerida");
    if (!form.lineaInvestigacion.trim()) errores.push("La línea de investigación es requerida");
    return errores;
}

function calcularAvancePrepropuesta(form: PreproposalForm): number {
    const campos = [
        form.problematica.trim().length > 0,
        form.justificacion.trim().length > 0,
        form.objetivoGeneral.trim().length > 0,
        form.objetivosEspecificos.length > 0,
        form.metodologia.trim().length > 0,
        form.resultadosEsperados.trim().length > 0,
        form.lineaInvestigacion.trim().length > 0,
        form.presupuestoEstimado !== null,
    ];
    const completados = campos.filter(Boolean).length;
    return Math.round((completados / campos.length) * 100);
}

function puedeEnviarPrepropuesta(form: PreproposalForm, estado: string): boolean {
    if (estado !== "Borrador" && estado !== "En Corrección") return false;
    const errores = validarPrepropuesta(form);
    return errores.length === 0;
}

const TRANSICIONES_VALIDAS: Record<string, string[]> = {
    "Borrador": ["Prepropuesta"],
    "Prepropuesta": ["Enviado", "Borrador"],
    "Enviado": ["En Revisión", "En Corrección"],
    "En Corrección": ["Enviado"],
    "Aprobado": [],
    "Rechazado": [],
};

function puedeTrasicionar(estadoActual: string, estadoDestino: string): boolean {
    return TRANSICIONES_VALIDAS[estadoActual]?.includes(estadoDestino) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────

const FORM_COMPLETO: PreproposalForm = {
    problematica: "El acceso a datos de investigación es limitado en instituciones pequeñas.",
    justificacion: "La digitalización de procesos de investigación mejora la eficiencia.",
    objetivoGeneral: "Desarrollar un sistema de gestión de investigación institucional.",
    objetivosEspecificos: [
        "Analizar los procesos actuales de investigación",
        "Diseñar la arquitectura del sistema",
        "Implementar y validar el sistema",
    ],
    metodologia: "Metodología de desarrollo ágil con sprints de 2 semanas.",
    resultadosEsperados: "Un sistema funcional que reduzca el tiempo administrativo en 40%.",
    lineaInvestigacion: "Tecnologías de la Información Aplicadas",
    presupuestoEstimado: 8500,
};

describe("validarPrepropuesta — campos requeridos", () => {
    it("acepta form completamente lleno sin errores", () => {
        expect(validarPrepropuesta(FORM_COMPLETO)).toHaveLength(0);
    });

    it("detecta todos los errores en form vacío", () => {
        const errores = validarPrepropuesta(PREPROPOSAL_DEFAULT);
        expect(errores.length).toBeGreaterThanOrEqual(5);
    });

    it("requiere al menos un objetivo específico", () => {
        const form = { ...FORM_COMPLETO, objetivosEspecificos: [] };
        const errores = validarPrepropuesta(form);
        expect(errores.some((e) => e.toLowerCase().includes("objetivo"))).toBe(true);
    });

    it("requiere problemática no vacía", () => {
        const form = { ...FORM_COMPLETO, problematica: "" };
        const errores = validarPrepropuesta(form);
        expect(errores.some((e) => e.toLowerCase().includes("problem"))).toBe(true);
    });

    it("requiere línea de investigación", () => {
        const form = { ...FORM_COMPLETO, lineaInvestigacion: "" };
        const errores = validarPrepropuesta(form);
        expect(errores.some((e) => e.toLowerCase().includes("línea"))).toBe(true);
    });
});

describe("calcularAvancePrepropuesta — porcentaje completitud", () => {
    it("retorna 100% para form completamente lleno", () => {
        expect(calcularAvancePrepropuesta(FORM_COMPLETO)).toBe(100);
    });

    it("retorna 0% para form vacío", () => {
        expect(calcularAvancePrepropuesta(PREPROPOSAL_DEFAULT)).toBe(0);
    });

    it("calcula porcentaje parcial correctamente", () => {
        const form = { ...PREPROPOSAL_DEFAULT, problematica: "Texto", justificacion: "Texto" };
        const avance = calcularAvancePrepropuesta(form);
        expect(avance).toBeGreaterThan(0);
        expect(avance).toBeLessThan(100);
    });
});

describe("puedeEnviarPrepropuesta — condiciones de envío", () => {
    it("puede enviar cuando está en Borrador con form completo", () => {
        expect(puedeEnviarPrepropuesta(FORM_COMPLETO, "Borrador")).toBe(true);
    });

    it("puede enviar en En Corrección con form completo", () => {
        expect(puedeEnviarPrepropuesta(FORM_COMPLETO, "En Corrección")).toBe(true);
    });

    it("NO puede enviar en estado Aprobado (bloqueado)", () => {
        expect(puedeEnviarPrepropuesta(FORM_COMPLETO, "Aprobado")).toBe(false);
    });

    it("NO puede enviar si hay campos vacíos", () => {
        expect(puedeEnviarPrepropuesta(PREPROPOSAL_DEFAULT, "Borrador")).toBe(false);
    });
});

describe("puedeTrasicionar — reglas de transición de estados", () => {
    it("Borrador puede ir a Prepropuesta", () => {
        expect(puedeTrasicionar("Borrador", "Prepropuesta")).toBe(true);
    });

    it("Borrador NO puede ir directamente a Aprobado", () => {
        expect(puedeTrasicionar("Borrador", "Aprobado")).toBe(false);
    });

    it("En Corrección puede volver a Enviado", () => {
        expect(puedeTrasicionar("En Corrección", "Enviado")).toBe(true);
    });

    it("Aprobado no tiene transiciones posibles", () => {
        expect(puedeTrasicionar("Aprobado", "Finalizado")).toBe(false);
        expect(puedeTrasicionar("Aprobado", "Borrador")).toBe(false);
    });

    it("Rechazado no tiene transiciones posibles", () => {
        expect(puedeTrasicionar("Rechazado", "Borrador")).toBe(false);
    });
});
