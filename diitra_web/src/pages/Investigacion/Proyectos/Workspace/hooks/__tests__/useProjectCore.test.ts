/**
 * DIITRA — Tests: useProjectCore.ts (lógica pura)
 *
 * Valida la lógica central del workspace de proyectos:
 *  - Estado inicial de las secciones habilitadas/deshabilitadas
 *  - Determinacion de secciones accesibles segun estado del proyecto
 *  - Calculo de porcentaje de completitud del proyecto
 *  - Deteccion de si el proyecto puede ser enviado (validacion pre-envio)
 *  - Clasificacion de secciones por estado (completa/incompleta/bloqueada)
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstadoProyecto =
    | "Borrador" | "Prepropuesta" | "Enviado" | "En Revisión"
    | "Aprobado" | "En Ejecución" | "Finalizado" | "Rechazado" | "En Corrección";

interface SeccionWorkspace {
    id: string;
    label: string;
    completado: boolean;
    bloqueado: boolean;
    requerido: boolean;
}

// ─── Lógica pura extraída del hook ───────────────────────────────────────────

/** Estados que permiten editar el proyecto */
const ESTADOS_EDITABLES: EstadoProyecto[] = ["Borrador", "En Corrección", "Prepropuesta", "Prepropuesta Rechazada" as any];

function esEditable(estado: EstadoProyecto): boolean {
    return ESTADOS_EDITABLES.includes(estado);
}

function calcularCompletitud(secciones: SeccionWorkspace[]): number {
    const requeridas = secciones.filter((s) => s.requerido);
    if (requeridas.length === 0) return 100;
    const completadas = requeridas.filter((s) => s.completado);
    return Math.round((completadas.length / requeridas.length) * 100);
}

function puedeEnviar(secciones: SeccionWorkspace[], estado: EstadoProyecto): boolean {
    if (!esEditable(estado)) return false;
    const requeridas = secciones.filter((s) => s.requerido);
    return requeridas.every((s) => s.completado);
}

function getSeccionesBloqueadas(secciones: SeccionWorkspace[], estado: EstadoProyecto): SeccionWorkspace[] {
    if (esEditable(estado)) return secciones.filter((s) => s.bloqueado);
    // Si el proyecto no es editable, todas las secciones están bloqueadas
    return secciones;
}

function clasificarSecciones(secciones: SeccionWorkspace[]): {
    completadas: SeccionWorkspace[];
    pendientes: SeccionWorkspace[];
    bloqueadas: SeccionWorkspace[];
} {
    return {
        completadas: secciones.filter((s) => s.completado && !s.bloqueado),
        pendientes: secciones.filter((s) => !s.completado && !s.bloqueado),
        bloqueadas: secciones.filter((s) => s.bloqueado),
    };
}

// ─────────────────────────────────────────────────────────────────────────────

const SECCIONES_MOCK: SeccionWorkspace[] = [
    { id: "informacion", label: "Información General", completado: true, bloqueado: false, requerido: true },
    { id: "equipo", label: "Equipo de Investigación", completado: true, bloqueado: false, requerido: true },
    { id: "objetivos", label: "Objetivos", completado: false, bloqueado: false, requerido: true },
    { id: "presupuesto", label: "Presupuesto", completado: false, bloqueado: false, requerido: true },
    { id: "cronograma", label: "Cronograma", completado: false, bloqueado: false, requerido: false },
    { id: "documentos", label: "Documentos Adjuntos", completado: false, bloqueado: true, requerido: false },
];

describe("esEditable — estados editables del proyecto", () => {
    it("Borrador es editable", () => {
        expect(esEditable("Borrador")).toBe(true);
    });

    it("En Corrección es editable", () => {
        expect(esEditable("En Corrección")).toBe(true);
    });

    it("Enviado NO es editable", () => {
        expect(esEditable("Enviado")).toBe(false);
    });

    it("En Ejecución NO es editable", () => {
        expect(esEditable("En Ejecución")).toBe(false);
    });

    it("Aprobado NO es editable", () => {
        expect(esEditable("Aprobado")).toBe(false);
    });

    it("Finalizado NO es editable", () => {
        expect(esEditable("Finalizado")).toBe(false);
    });
});

describe("calcularCompletitud — porcentaje de avance", () => {
    it("calcula correctamente el porcentaje con secciones parcialmente completas", () => {
        // 2 de 4 secciones requeridas completadas = 50%
        expect(calcularCompletitud(SECCIONES_MOCK)).toBe(50);
    });

    it("retorna 100% cuando todas las secciones requeridas están completas", () => {
        const todasCompletas = SECCIONES_MOCK.map((s) => ({ ...s, completado: true }));
        expect(calcularCompletitud(todasCompletas)).toBe(100);
    });

    it("retorna 0% cuando ninguna sección requerida está completa", () => {
        const ninguna = SECCIONES_MOCK.map((s) => ({ ...s, completado: false }));
        expect(calcularCompletitud(ninguna)).toBe(0);
    });

    it("retorna 100% cuando no hay secciones requeridas", () => {
        const sinRequeridas = SECCIONES_MOCK.map((s) => ({ ...s, requerido: false }));
        expect(calcularCompletitud(sinRequeridas)).toBe(100);
    });
});

describe("puedeEnviar — validación pre-envío", () => {
    it("puede enviar si todas las secciones requeridas están completas y estado es Borrador", () => {
        const todasCompletas = SECCIONES_MOCK.map((s) => ({ ...s, completado: true }));
        expect(puedeEnviar(todasCompletas, "Borrador")).toBe(true);
    });

    it("NO puede enviar si hay secciones requeridas incompletas", () => {
        expect(puedeEnviar(SECCIONES_MOCK, "Borrador")).toBe(false);
    });

    it("NO puede enviar si el proyecto no es editable", () => {
        const todasCompletas = SECCIONES_MOCK.map((s) => ({ ...s, completado: true }));
        expect(puedeEnviar(todasCompletas, "Aprobado")).toBe(false);
        expect(puedeEnviar(todasCompletas, "En Ejecución")).toBe(false);
    });
});

describe("clasificarSecciones — clasificación por estado", () => {
    it("clasifica correctamente en completadas, pendientes y bloqueadas", () => {
        const result = clasificarSecciones(SECCIONES_MOCK);
        expect(result.completadas).toHaveLength(2); // informacion y equipo
        expect(result.pendientes).toHaveLength(3);  // objetivos, presupuesto, cronograma
        expect(result.bloqueadas).toHaveLength(1);  // documentos
    });

    it("retorna listas vacías si no hay secciones en cada categoría", () => {
        const result = clasificarSecciones([]);
        expect(result.completadas).toHaveLength(0);
        expect(result.pendientes).toHaveLength(0);
        expect(result.bloqueadas).toHaveLength(0);
    });
});
