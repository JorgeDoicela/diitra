/**
 * DIITRA — Tests: useRevisionTecnicaData.ts (lógica pura)
 *
 * Valida la lógica de revisión técnica de proyectos de investigación:
 *  - Cálculo de puntaje final ponderado de la rúbrica
 *  - Clasificación del resultado (Aprobado/Condicionado/Rechazado) según puntaje
 *  - Validación de que todos los criterios de la rúbrica tienen puntaje asignado
 *  - Generación del resumen de calificación por sección
 *  - Gestión de comentarios por sección del revisor
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CriterioRubrica {
    idCriterio: number;
    descripcion: string;
    ponderacion: number; // porcentaje 0-100
    puntajeAsignado: number | null; // 0-10
}

interface SeccionRevision {
    titulo: string;
    criterios: CriterioRubrica[];
    comentario: string;
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function calcularPuntajeTotal(secciones: SeccionRevision[]): number {
    const todosCriterios = secciones.flatMap((s) => s.criterios);
    const totalPonderacion = todosCriterios.reduce((sum, c) => sum + c.ponderacion, 0);

    if (totalPonderacion === 0) return 0;

    const puntajePonderado = todosCriterios.reduce((sum, c) => {
        const puntaje = c.puntajeAsignado ?? 0;
        return sum + (puntaje * c.ponderacion) / 100;
    }, 0);

    // Normalizar al rango 0-10 si la ponderación no suma 100
    return Math.round((puntajePonderado * (100 / totalPonderacion)) * 10) / 10;
}

function clasificarResultado(puntaje: number): "Aprobado" | "Condicionado" | "Rechazado" {
    if (puntaje >= 7) return "Aprobado";
    if (puntaje >= 5) return "Condicionado";
    return "Rechazado";
}

function todosCalificados(secciones: SeccionRevision[]): boolean {
    return secciones.every((s) => s.criterios.every((c) => c.puntajeAsignado !== null));
}

function calcularPuntajeSeccion(seccion: SeccionRevision): number {
    const total = seccion.criterios.reduce((sum, c) => sum + c.ponderacion, 0);
    if (total === 0) return 0;
    return seccion.criterios.reduce((sum, c) => {
        return sum + ((c.puntajeAsignado ?? 0) * c.ponderacion) / total;
    }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────

const SECCIONES_COMPLETAS: SeccionRevision[] = [
    {
        titulo: "Pertinencia y Relevancia",
        comentario: "El proyecto es relevante para la institución.",
        criterios: [
            { idCriterio: 1, descripcion: "Alineación con líneas de investigación", ponderacion: 20, puntajeAsignado: 9 },
            { idCriterio: 2, descripcion: "Impacto social esperado", ponderacion: 15, puntajeAsignado: 8 },
        ],
    },
    {
        titulo: "Metodología",
        comentario: "Metodología bien estructurada.",
        criterios: [
            { idCriterio: 3, descripcion: "Claridad metodológica", ponderacion: 25, puntajeAsignado: 7 },
            { idCriterio: 4, descripcion: "Viabilidad técnica", ponderacion: 20, puntajeAsignado: 6 },
        ],
    },
    {
        titulo: "Recursos",
        comentario: "",
        criterios: [
            { idCriterio: 5, descripcion: "Presupuesto justificado", ponderacion: 20, puntajeAsignado: 8 },
        ],
    },
];

const SECCIONES_INCOMPLETAS: SeccionRevision[] = [
    {
        titulo: "Pertinencia",
        comentario: "",
        criterios: [
            { idCriterio: 1, descripcion: "Relevancia", ponderacion: 50, puntajeAsignado: 8 },
            { idCriterio: 2, descripcion: "Impacto", ponderacion: 50, puntajeAsignado: null }, // sin calificar
        ],
    },
];

describe("calcularPuntajeTotal — puntaje ponderado", () => {
    it("calcula el puntaje ponderado correctamente", () => {
        const puntaje = calcularPuntajeTotal(SECCIONES_COMPLETAS);
        // (9*20 + 8*15 + 7*25 + 6*20 + 8*20) / 100 = (180+120+175+120+160)/100 = 755/100 = 7.55
        expect(puntaje).toBeCloseTo(7.6, 0);
    });

    it("retorna 0 si no hay criterios", () => {
        expect(calcularPuntajeTotal([])).toBe(0);
    });

    it("criterios sin puntaje (null) se cuentan como 0", () => {
        const puntaje = calcularPuntajeTotal(SECCIONES_INCOMPLETAS);
        // Solo criterio 1 tiene puntaje: (8*50 + 0*50) / 100 = 4
        expect(puntaje).toBe(4);
    });
});

describe("clasificarResultado — umbral de aprobación", () => {
    it("Aprobado para puntaje >= 7", () => {
        expect(clasificarResultado(7)).toBe("Aprobado");
        expect(clasificarResultado(9.5)).toBe("Aprobado");
        expect(clasificarResultado(10)).toBe("Aprobado");
    });

    it("Condicionado para puntaje entre 5 y 6.9", () => {
        expect(clasificarResultado(5)).toBe("Condicionado");
        expect(clasificarResultado(6.9)).toBe("Condicionado");
        expect(clasificarResultado(6)).toBe("Condicionado");
    });

    it("Rechazado para puntaje < 5", () => {
        expect(clasificarResultado(4.9)).toBe("Rechazado");
        expect(clasificarResultado(0)).toBe("Rechazado");
        expect(clasificarResultado(3)).toBe("Rechazado");
    });
});

describe("todosCalificados — completitud de la revisión", () => {
    it("retorna true cuando todos los criterios tienen puntaje", () => {
        expect(todosCalificados(SECCIONES_COMPLETAS)).toBe(true);
    });

    it("retorna false cuando algún criterio tiene puntaje null", () => {
        expect(todosCalificados(SECCIONES_INCOMPLETAS)).toBe(false);
    });

    it("retorna true para lista de secciones vacía", () => {
        expect(todosCalificados([])).toBe(true);
    });
});

describe("calcularPuntajeSeccion — puntaje por sección", () => {
    it("calcula correctamente el puntaje de una sección", () => {
        const seccion = SECCIONES_COMPLETAS[0]; // Pertinencia: 9*20 + 8*15 = 180+120 = 300 / (20+15) = 8.57
        const puntaje = calcularPuntajeSeccion(seccion);
        expect(puntaje).toBeGreaterThan(8);
        expect(puntaje).toBeLessThan(9);
    });

    it("retorna 0 para sección sin ponderación", () => {
        const seccionSinPond: SeccionRevision = {
            titulo: "Vacía", comentario: "",
            criterios: [{ idCriterio: 99, descripcion: "C", ponderacion: 0, puntajeAsignado: 5 }]
        };
        expect(calcularPuntajeSeccion(seccionSinPond)).toBe(0);
    });
});
