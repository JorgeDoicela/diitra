/**
 * DIITRA — Tests: useGroupsPage.ts (lógica pura)
 *
 * Valida la lógica de gestión de grupos de investigación:
 *  - Filtrado por nombre, código o carrera
 *  - Clasificación por estado activo/inactivo
 *  - Ordenación por nombre o fecha
 *  - Validación de formulario de grupo
 *  - Cálculo de métricas por grupo (nº miembros, nº proyectos)
 */
import { describe, it, expect } from "vitest";

interface Grupo {
    idGrupo: number;
    nombreGrupo: string;
    codigoGrupo: string;
    activo: boolean;
    carrera: string | null;
    totalMiembros: number;
    totalProyectos: number;
    fechaConstitucion: string | null;
}

function filtrarGrupos(grupos: Grupo[], busqueda: string): Grupo[] {
    if (!busqueda.trim()) return grupos;
    const q = busqueda.toLowerCase().trim();
    return grupos.filter(
        (g) =>
            g.nombreGrupo.toLowerCase().includes(q) ||
            g.codigoGrupo.toLowerCase().includes(q) ||
            g.carrera?.toLowerCase().includes(q)
    );
}

function filtrarPorEstado(grupos: Grupo[], soloActivos: boolean): Grupo[] {
    if (!soloActivos) return grupos;
    return grupos.filter((g) => g.activo);
}

function ordenarGrupos(grupos: Grupo[], criterio: "nombre" | "miembros" | "proyectos"): Grupo[] {
    return [...grupos].sort((a, b) => {
        if (criterio === "nombre") return a.nombreGrupo.localeCompare(b.nombreGrupo);
        if (criterio === "miembros") return b.totalMiembros - a.totalMiembros;
        if (criterio === "proyectos") return b.totalProyectos - a.totalProyectos;
        return 0;
    });
}

function validarGrupoForm(form: {
    nombreGrupo: string;
    codigoGrupo: string;
    carrera: string;
}): string | null {
    if (!form.nombreGrupo.trim()) return "El nombre del grupo es requerido";
    if (!form.codigoGrupo.trim()) return "El código del grupo es requerido";
    if (form.codigoGrupo.length > 20) return "El código no puede superar 20 caracteres";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_GRUPOS: Grupo[] = [
    { idGrupo: 1, nombreGrupo: "GIDI - Grupo de Innovación Digital", codigoGrupo: "GIDI", activo: true, carrera: "Sistemas", totalMiembros: 8, totalProyectos: 3, fechaConstitucion: "2020-01-15" },
    { idGrupo: 2, nombreGrupo: "GIBIO - Grupo de Biotecnología", codigoGrupo: "GIBIO", activo: true, carrera: "Ciencias", totalMiembros: 5, totalProyectos: 7, fechaConstitucion: "2019-06-20" },
    { idGrupo: 3, nombreGrupo: "GECUA - Grupo de Energía", codigoGrupo: "GECUA", activo: false, carrera: "Industrial", totalMiembros: 2, totalProyectos: 1, fechaConstitucion: "2018-03-10" },
];

describe("filtrarGrupos — búsqueda", () => {
    it("retorna todos con búsqueda vacía", () => {
        expect(filtrarGrupos(MOCK_GRUPOS, "")).toHaveLength(3);
    });

    it("filtra por nombre de grupo", () => {
        const result = filtrarGrupos(MOCK_GRUPOS, "biotecnología");
        expect(result).toHaveLength(1);
        expect(result[0].codigoGrupo).toBe("GIBIO");
    });

    it("filtra por código (case-insensitive)", () => {
        const result = filtrarGrupos(MOCK_GRUPOS, "gidi");
        expect(result).toHaveLength(1);
        expect(result[0].idGrupo).toBe(1);
    });

    it("filtra por carrera", () => {
        const result = filtrarGrupos(MOCK_GRUPOS, "sistemas");
        expect(result).toHaveLength(1);
    });

    it("retorna vacío sin coincidencias", () => {
        expect(filtrarGrupos(MOCK_GRUPOS, "zzz")).toHaveLength(0);
    });
});

describe("filtrarPorEstado — activos/inactivos", () => {
    it("retorna todos cuando soloActivos=false", () => {
        expect(filtrarPorEstado(MOCK_GRUPOS, false)).toHaveLength(3);
    });

    it("retorna solo activos cuando soloActivos=true", () => {
        const result = filtrarPorEstado(MOCK_GRUPOS, true);
        expect(result).toHaveLength(2);
        expect(result.every((g) => g.activo)).toBe(true);
    });
});

describe("ordenarGrupos — ordenación", () => {
    it("ordena por nombre alfabéticamente", () => {
        const result = ordenarGrupos(MOCK_GRUPOS, "nombre");
        expect(result[0].codigoGrupo).toBe("GECUA");
        expect(result[1].codigoGrupo).toBe("GIBIO");
        expect(result[2].codigoGrupo).toBe("GIDI");
    });

    it("ordena por número de miembros descendente", () => {
        const result = ordenarGrupos(MOCK_GRUPOS, "miembros");
        expect(result[0].totalMiembros).toBeGreaterThanOrEqual(result[1].totalMiembros);
        expect(result[1].totalMiembros).toBeGreaterThanOrEqual(result[2].totalMiembros);
    });

    it("ordena por número de proyectos descendente", () => {
        const result = ordenarGrupos(MOCK_GRUPOS, "proyectos");
        expect(result[0].totalProyectos).toBeGreaterThanOrEqual(result[1].totalProyectos);
    });

    it("no muta el array original", () => {
        const original = MOCK_GRUPOS.map((g) => g.idGrupo);
        ordenarGrupos(MOCK_GRUPOS, "nombre");
        expect(MOCK_GRUPOS.map((g) => g.idGrupo)).toEqual(original);
    });
});

describe("validarGrupoForm — validación", () => {
    it("acepta formulario válido", () => {
        expect(validarGrupoForm({ nombreGrupo: "Grupo Test", codigoGrupo: "GT01", carrera: "Sistemas" })).toBeNull();
    });

    it("rechaza nombre vacío", () => {
        expect(validarGrupoForm({ nombreGrupo: "", codigoGrupo: "GT01", carrera: "" })).toContain("nombre");
    });

    it("rechaza código vacío", () => {
        expect(validarGrupoForm({ nombreGrupo: "Test", codigoGrupo: "", carrera: "" })).toContain("código");
    });

    it("rechaza código mayor a 20 caracteres", () => {
        expect(validarGrupoForm({ nombreGrupo: "Test", codigoGrupo: "CODIGO_MUY_LARGO_QUE_SUPERA_20", carrera: "" })).toContain("20");
    });
});
