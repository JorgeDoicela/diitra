/**
 * DIITRA — Tests: useAnalyticsData.ts (lógica pura)
 *
 * Valida la lógica de transformación de datos para el módulo de Analytics:
 *  - Cálculo de porcentajes de estados (proyectos activos/borrador/aprobados)
 *  - Agrupación de proyectos por línea de investigación
 *  - Cálculo de ratio presupuesto asignado vs ejecutado
 *  - Generación de datos para gráficas (labels, values)
 *  - Formateo de montos en USD
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EstadoConteo {
    estado: string;
    cantidad: number;
    color: string;
}

interface ProyectoResumen {
    uuid: string;
    titulo: string;
    estado: string;
    lineaInvestigacion: string | null;
    presupuestoTotal: number | null;
    presupuestoEjecutado: number | null;
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function calcularPorcentaje(parte: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((parte / total) * 100 * 10) / 10; // 1 decimal
}

function agruparPorLinea(proyectos: ProyectoResumen[]): Record<string, number> {
    return proyectos.reduce((acc, p) => {
        const linea = p.lineaInvestigacion ?? "Sin línea";
        acc[linea] = (acc[linea] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

function calcularEjecucion(asignado: number, ejecutado: number): number {
    if (asignado === 0) return 0;
    return Math.round((ejecutado / asignado) * 100 * 10) / 10;
}

function formatearMonto(monto: number | null, moneda = "USD"): string {
    if (monto === null || monto === undefined) return "—";
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: moneda }).format(monto);
}

function prepararDatosGrafico(estados: EstadoConteo[]): { labels: string[]; values: number[]; colors: string[] } {
    const total = estados.reduce((sum, e) => sum + e.cantidad, 0);
    return {
        labels: estados.map((e) => `${e.estado} (${calcularPorcentaje(e.cantidad, total)}%)`),
        values: estados.map((e) => e.cantidad),
        colors: estados.map((e) => e.color),
    };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("calcularPorcentaje", () => {
    it("calcula porcentaje correctamente", () => {
        expect(calcularPorcentaje(25, 100)).toBe(25);
        expect(calcularPorcentaje(1, 3)).toBe(33.3);
    });

    it("retorna 0 cuando el total es 0 (evita división por cero)", () => {
        expect(calcularPorcentaje(0, 0)).toBe(0);
        expect(calcularPorcentaje(5, 0)).toBe(0);
    });

    it("retorna 100 para parte igual al total", () => {
        expect(calcularPorcentaje(10, 10)).toBe(100);
    });
});

describe("agruparPorLinea — agrupación de proyectos", () => {
    const proyectos: ProyectoResumen[] = [
        { uuid: "a", titulo: "P1", estado: "Activo", lineaInvestigacion: "IA", presupuestoTotal: 10000, presupuestoEjecutado: 5000 },
        { uuid: "b", titulo: "P2", estado: "Borrador", lineaInvestigacion: "IA", presupuestoTotal: null, presupuestoEjecutado: null },
        { uuid: "c", titulo: "P3", estado: "Activo", lineaInvestigacion: "Biotecnología", presupuestoTotal: 20000, presupuestoEjecutado: 15000 },
        { uuid: "d", titulo: "P4", estado: "Activo", lineaInvestigacion: null, presupuestoTotal: 5000, presupuestoEjecutado: 0 },
    ];

    it("cuenta proyectos por línea correctamente", () => {
        const result = agruparPorLinea(proyectos);
        expect(result["IA"]).toBe(2);
        expect(result["Biotecnología"]).toBe(1);
        expect(result["Sin línea"]).toBe(1);
    });

    it("retorna objeto vacío para lista vacía", () => {
        expect(agruparPorLinea([])).toEqual({});
    });
});

describe("calcularEjecucion — ratio presupuestario", () => {
    it("calcula porcentaje de ejecución correctamente", () => {
        expect(calcularEjecucion(100000, 75000)).toBe(75);
        expect(calcularEjecucion(50000, 25000)).toBe(50);
    });

    it("retorna 0 cuando asignado es 0", () => {
        expect(calcularEjecucion(0, 0)).toBe(0);
    });

    it("puede exceder 100% si hay sobreje cución", () => {
        expect(calcularEjecucion(10000, 11000)).toBe(110);
    });
});

describe("formatearMonto — formato de moneda", () => {
    it("formatea monto en USD correctamente", () => {
        const resultado = formatearMonto(15000);
        expect(resultado).toContain("15");
        expect(resultado).toContain("000");
    });

    it("retorna '—' para monto null", () => {
        expect(formatearMonto(null)).toBe("—");
    });

    it("maneja monto cero", () => {
        const resultado = formatearMonto(0);
        expect(resultado).not.toBe("—");
    });
});

describe("prepararDatosGrafico — datos para charts", () => {
    const estados: EstadoConteo[] = [
        { estado: "Activo", cantidad: 15, color: "#10B981" },
        { estado: "Borrador", cantidad: 10, color: "#94A3B8" },
        { estado: "Aprobado", cantidad: 5, color: "#3B82F6" },
    ];

    it("genera labels, values y colors de igual longitud", () => {
        const result = prepararDatosGrafico(estados);
        expect(result.labels).toHaveLength(3);
        expect(result.values).toHaveLength(3);
        expect(result.colors).toHaveLength(3);
    });

    it("incluye porcentaje en el label", () => {
        const result = prepararDatosGrafico(estados);
        expect(result.labels[0]).toContain("%");
    });

    it("valores corresponden a las cantidades originales", () => {
        const result = prepararDatosGrafico(estados);
        expect(result.values[0]).toBe(15);
        expect(result.values[1]).toBe(10);
        expect(result.values[2]).toBe(5);
    });

    it("maneja lista vacía sin crashear", () => {
        const result = prepararDatosGrafico([]);
        expect(result.labels).toHaveLength(0);
        expect(result.values).toHaveLength(0);
    });
});
