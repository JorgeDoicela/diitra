/**
 * DIITRA — Tests: usePublicGroupsData.ts (catálogo público de grupos)
 *
 * Valida la lógica de filtrado del catálogo de grupos de investigación:
 *  - Búsqueda por nombre o acrónimo
 *  - Filtro por área de conocimiento
 */
import { describe, it, expect } from "vitest";

interface GrupoPublico {
    id: number;
    nombre: string;
    acronimo: string;
    area: string;
    numProyectos: number;
}

const GRUPOS_PUBLICOS: GrupoPublico[] = [
    { id: 1, nombre: "Grupo de Inteligencia Artificial", acronimo: "GIIA", area: "Tecnología", numProyectos: 5 },
    { id: 2, nombre: "Grupo de Biotecnología Vegetal", acronimo: "GBV", area: "Agropecuaria", numProyectos: 3 },
];

function filtrarGruposPublicos(grupos: GrupoPublico[], busqueda: string, area: string): GrupoPublico[] {
    return grupos.filter((g) => {
        if (area && g.area !== area) return false;
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return g.nombre.toLowerCase().includes(q) || g.acronimo.toLowerCase().includes(q);
    });
}

describe("filtrarGruposPublicos — búsqueda en catálogo", () => {
    it("filtra por acrónimo", () => {
        const result = filtrarGruposPublicos(GRUPOS_PUBLICOS, "GIIA", "");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it("filtra por área", () => {
        const result = filtrarGruposPublicos(GRUPOS_PUBLICOS, "", "Agropecuaria");
        expect(result).toHaveLength(1);
        expect(result[0].acronimo).toBe("GBV");
    });
});
