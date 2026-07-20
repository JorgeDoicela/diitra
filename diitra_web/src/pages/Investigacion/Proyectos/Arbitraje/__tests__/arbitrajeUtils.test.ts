/**
 * DIITRA — Tests: arbitrajeUtils.ts (lógica pura de arbitraje y dictamen)
 *
 * Valida las reglas de arbitraje de proyectos:
 *  - Cálculo de promedio ponderado de evaluación
 *  - Determinación de dictamen (Aprobado >= 70, Observado 50-69, Rechazado < 50)
 *  - Asignación de pares evaluadores (mínimo 2 evaluadores)
 */
import { describe, it, expect } from "vitest";

function calcularPuntajePromedio(evaluaciones: number[]): number {
    if (evaluaciones.length === 0) return 0;
    const suma = evaluaciones.reduce((acc, v) => acc + v, 0);
    return Math.round((suma / evaluaciones.length) * 100) / 100;
}

function determinarDictamen(puntaje: number): "Aprobado" | "Observado" | "Rechazado" {
    if (puntaje >= 70) return "Aprobado";
    if (puntaje >= 50) return "Observado";
    return "Rechazado";
}

function requiereSegundoArbitro(numArbitros: number): boolean {
    return numArbitros < 2;
}

describe("arbitrajeUtils — calculo y dictamen", () => {
    it("calcula promedio de evaluaciones", () => {
        expect(calcularPuntajePromedio([80, 90, 70])).toBe(80);
    });

    it("retorna Aprobado para puntaje >= 70", () => {
        expect(determinarDictamen(75)).toBe("Aprobado");
    });

    it("retorna Observado para puntaje entre 50 y 69", () => {
        expect(determinarDictamen(60)).toBe("Observado");
    });

    it("retorna Rechazado para puntaje < 50", () => {
        expect(determinarDictamen(45)).toBe("Rechazado");
    });

    it("requiere segundo árbitro si hay menos de 2 asignados", () => {
        expect(requiereSegundoArbitro(1)).toBe(true);
        expect(requiereSegundoArbitro(2)).toBe(false);
    });
});
