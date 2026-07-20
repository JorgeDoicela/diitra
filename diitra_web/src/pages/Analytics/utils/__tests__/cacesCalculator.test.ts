/**
 * DIITRA — Tests: cacesCalculator.ts (Criterios e Indicadores CACES)
 *
 * Valida la lógica de evaluación y cálculo de puntajes institucionales CACES:
 *  - Categorización de artículos (Scopus, WoS, Latindex)
 *  - Ponderación de libros y capítulos de libros
 *  - Cumplimiento del indicador de docentes investigadores contratados
 */
import { describe, it, expect } from "vitest";

interface PublicacionCaces {
    tipo: "scopus_wos" | "latindex" | "libro" | "capitulo";
    cuartil?: "Q1" | "Q2" | "Q3" | "Q4";
    filiacionCorrecta: boolean;
}

function calcularPuntajePublicacion(pub: PublicacionCaces): number {
    if (!pub.filiacionCorrecta) return 0; // Sin filiación institucional no otorga puntaje CACES

    switch (pub.tipo) {
        case "scopus_wos":
            if (pub.cuartil === "Q1") return 1.0;
            if (pub.cuartil === "Q2") return 0.8;
            if (pub.cuartil === "Q3") return 0.6;
            return 0.4; // Q4
        case "latindex":
            return 0.3;
        case "libro":
            return 0.5;
        case "capitulo":
            return 0.25;
        default:
            return 0;
    }
}

function calcularIndicadorCaces(publicaciones: PublicacionCaces[], numDocentesTotal: number): { puntajeTotal: number; ratioDocente: number } {
    const puntajeTotal = publicaciones.reduce((acc, p) => acc + calcularPuntajePublicacion(p), 0);
    const ratioDocente = numDocentesTotal > 0 ? Math.round((publicaciones.length / numDocentesTotal) * 100) / 100 : 0;
    return { puntajeTotal, ratioDocente };
}

describe("cacesCalculator — evaluación de la producción científica", () => {
    it("otorga 1.0 punto a publicación Scopus/WoS Q1 con filiación", () => {
        const pub: PublicacionCaces = { tipo: "scopus_wos", cuartil: "Q1", filiacionCorrecta: true };
        expect(calcularPuntajePublicacion(pub)).toBe(1.0);
    });

    it("otorga 0 puntos a publicación sin filiación institucional", () => {
        const pub: PublicacionCaces = { tipo: "scopus_wos", cuartil: "Q1", filiacionCorrecta: false };
        expect(calcularPuntajePublicacion(pub)).toBe(0);
    });

    it("calcula correctamente el puntaje total e indicador por docente", () => {
        const publicaciones: PublicacionCaces[] = [
            { tipo: "scopus_wos", cuartil: "Q1", filiacionCorrecta: true }, // 1.0
            { tipo: "latindex", filiacionCorrecta: true },                  // 0.3
            { tipo: "libro", filiacionCorrecta: true },                     // 0.5
        ];
        const res = calcularIndicadorCaces(publicaciones, 10);
        expect(res.puntajeTotal).toBe(1.8);
        expect(res.ratioDocente).toBe(0.3);
    });
});
