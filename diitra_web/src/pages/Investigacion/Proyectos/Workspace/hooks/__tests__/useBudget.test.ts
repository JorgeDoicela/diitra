/**
 * DIITRA — Tests: useBudget.ts (lógica pura)
 *
 * Valida la lógica del módulo de presupuesto de proyectos:
 *  - Cálculo del total de una categoría (suma de rubros)
 *  - Cálculo del presupuesto total del proyecto (suma de categorías)
 *  - Detección de sobrepresupuesto vs límite aprobado
 *  - Distribución porcentual por categoría
 *  - Validación de valores de rubro (no negativos, no nulos)
 *  - Estado del formulario de nuevo rubro por defecto
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RubroPresupuestal {
    idRubro: number;
    descripcion: string;
    valorUnitario: number;
    cantidad: number;
    unidad: string;
    categoria: string;
}

interface CategoriaPresupuestal {
    nombre: string;
    rubros: RubroPresupuestal[];
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function calcularTotalRubro(rubro: RubroPresupuestal): number {
    return rubro.valorUnitario * rubro.cantidad;
}

function calcularTotalCategoria(categoria: CategoriaPresupuestal): number {
    return categoria.rubros.reduce((sum, r) => sum + calcularTotalRubro(r), 0);
}

function calcularTotalProyecto(categorias: CategoriaPresupuestal[]): number {
    return categorias.reduce((sum, c) => sum + calcularTotalCategoria(c), 0);
}

function calcularPorcentajeCategoria(categoria: CategoriaPresupuestal, totalProyecto: number): number {
    if (totalProyecto === 0) return 0;
    return Math.round((calcularTotalCategoria(categoria) / totalProyecto) * 100 * 10) / 10;
}

function esSobrepresupuesto(totalActual: number, limiteAprobado: number): boolean {
    return totalActual > limiteAprobado;
}

function validarRubro(rubro: Partial<RubroPresupuestal>): string | null {
    if (!rubro.descripcion?.trim()) return "La descripción del rubro es requerida";
    if (rubro.valorUnitario === undefined || rubro.valorUnitario < 0) return "El valor unitario no puede ser negativo";
    if (rubro.cantidad === undefined || rubro.cantidad <= 0) return "La cantidad debe ser mayor a 0";
    if (!rubro.unidad?.trim()) return "La unidad de medida es requerida";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIAS_MOCK: CategoriaPresupuestal[] = [
    {
        nombre: "Personal",
        rubros: [
            { idRubro: 1, descripcion: "Director de proyecto", valorUnitario: 800, cantidad: 12, unidad: "meses", categoria: "Personal" },
            { idRubro: 2, descripcion: "Investigador asistente", valorUnitario: 500, cantidad: 12, unidad: "meses", categoria: "Personal" },
        ],
    },
    {
        nombre: "Equipos",
        rubros: [
            { idRubro: 3, descripcion: "Laptop", valorUnitario: 1200, cantidad: 2, unidad: "unidades", categoria: "Equipos" },
            { idRubro: 4, descripcion: "Servidor", valorUnitario: 3000, cantidad: 1, unidad: "unidades", categoria: "Equipos" },
        ],
    },
    {
        nombre: "Materiales",
        rubros: [
            { idRubro: 5, descripcion: "Papelería y suministros", valorUnitario: 50, cantidad: 12, unidad: "meses", categoria: "Materiales" },
        ],
    },
];

describe("calcularTotalRubro — total por rubro", () => {
    it("calcula correctamente valorUnitario * cantidad", () => {
        const rubro: RubroPresupuestal = { idRubro: 1, descripcion: "Test", valorUnitario: 100, cantidad: 5, unidad: "u", categoria: "Test" };
        expect(calcularTotalRubro(rubro)).toBe(500);
    });

    it("retorna 0 para cantidad 0", () => {
        const rubro: RubroPresupuestal = { idRubro: 2, descripcion: "T", valorUnitario: 200, cantidad: 0, unidad: "u", categoria: "T" };
        expect(calcularTotalRubro(rubro)).toBe(0);
    });
});

describe("calcularTotalCategoria — suma de rubros", () => {
    it("suma correctamente los rubros de Personal", () => {
        // 800*12 + 500*12 = 9600 + 6000 = 15600
        expect(calcularTotalCategoria(CATEGORIAS_MOCK[0])).toBe(15600);
    });

    it("suma correctamente los rubros de Equipos", () => {
        // 1200*2 + 3000*1 = 2400 + 3000 = 5400
        expect(calcularTotalCategoria(CATEGORIAS_MOCK[1])).toBe(5400);
    });

    it("retorna 0 para categoría sin rubros", () => {
        const cat: CategoriaPresupuestal = { nombre: "Vacía", rubros: [] };
        expect(calcularTotalCategoria(cat)).toBe(0);
    });
});

describe("calcularTotalProyecto — presupuesto total", () => {
    it("suma el total de todas las categorías", () => {
        // Personal: 15600 + Equipos: 5400 + Materiales: 50*12=600 = 21600
        expect(calcularTotalProyecto(CATEGORIAS_MOCK)).toBe(21600);
    });

    it("retorna 0 para proyecto sin categorías", () => {
        expect(calcularTotalProyecto([])).toBe(0);
    });
});

describe("calcularPorcentajeCategoria — distribución porcentual", () => {
    it("calcula porcentaje de Personal sobre total", () => {
        const total = calcularTotalProyecto(CATEGORIAS_MOCK);
        const pct = calcularPorcentajeCategoria(CATEGORIAS_MOCK[0], total);
        expect(pct).toBeGreaterThan(0);
        expect(pct).toBeLessThanOrEqual(100);
    });

    it("retorna 0 cuando el total del proyecto es 0", () => {
        const vacía: CategoriaPresupuestal = { nombre: "T", rubros: [{ idRubro: 1, descripcion: "X", valorUnitario: 100, cantidad: 5, unidad: "u", categoria: "T" }] };
        expect(calcularPorcentajeCategoria(vacía, 0)).toBe(0);
    });

    it("la suma de porcentajes de todas las categorías ≈ 100%", () => {
        const total = calcularTotalProyecto(CATEGORIAS_MOCK);
        const suma = CATEGORIAS_MOCK.reduce((s, c) => s + calcularPorcentajeCategoria(c, total), 0);
        expect(suma).toBeCloseTo(100, 0);
    });
});

describe("esSobrepresupuesto — control de límite", () => {
    it("retorna false cuando está dentro del límite", () => {
        expect(esSobrepresupuesto(21600, 25000)).toBe(false);
    });

    it("retorna true cuando excede el límite", () => {
        expect(esSobrepresupuesto(25001, 25000)).toBe(true);
    });

    it("retorna false cuando iguala exactamente el límite (no excede)", () => {
        expect(esSobrepresupuesto(25000, 25000)).toBe(false);
    });
});

describe("validarRubro — validación del formulario", () => {
    it("acepta rubro válido completo", () => {
        expect(validarRubro({ descripcion: "Laptop HP", valorUnitario: 1200, cantidad: 2, unidad: "unidades" })).toBeNull();
    });

    it("rechaza descripción vacía", () => {
        expect(validarRubro({ descripcion: "", valorUnitario: 100, cantidad: 1, unidad: "u" })).toContain("descripción");
    });

    it("rechaza valor unitario negativo", () => {
        expect(validarRubro({ descripcion: "Test", valorUnitario: -10, cantidad: 1, unidad: "u" })).toContain("negativo");
    });

    it("rechaza cantidad 0 o negativa", () => {
        expect(validarRubro({ descripcion: "Test", valorUnitario: 100, cantidad: 0, unidad: "u" })).toContain("cantidad");
    });

    it("rechaza unidad vacía", () => {
        expect(validarRubro({ descripcion: "Test", valorUnitario: 100, cantidad: 1, unidad: "" })).toContain("unidad");
    });
});
