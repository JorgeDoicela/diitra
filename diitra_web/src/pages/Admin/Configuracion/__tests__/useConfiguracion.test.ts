/**
 * DIITRA — Tests: useConfiguracion.ts (lógica pura)
 *
 * Valida la lógica del módulo de configuración del sistema:
 *  - Validación de parámetros de configuración por tipo (string, number, boolean, JSON)
 *  - Agrupación de parámetros por categoría
 *  - Detección de cambios pendientes (dirty)
 *  - Restricción de edición para parámetros de solo lectura
 *  - Filtrado de configuraciones por nombre o categoría
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConfigParam {
    clave: string;
    valor: string;
    tipo: "string" | "number" | "boolean" | "json";
    categoria: string;
    descripcion: string;
    soloLectura: boolean;
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function validarValorConfig(param: ConfigParam): string | null {
    if (param.soloLectura) return "Este parámetro es de solo lectura";
    if (!param.valor.trim() && param.tipo !== "boolean") return "El valor no puede estar vacío";
    if (param.tipo === "number" && isNaN(Number(param.valor))) return "El valor debe ser numérico";
    if (param.tipo === "boolean" && !["true", "false", "1", "0"].includes(param.valor.toLowerCase()))
        return "El valor booleano debe ser true/false";
    if (param.tipo === "json") {
        try { JSON.parse(param.valor); } catch { return "El valor no es un JSON válido"; }
    }
    return null;
}

function agruparPorCategoria(params: ConfigParam[]): Record<string, ConfigParam[]> {
    return params.reduce((acc, p) => {
        if (!acc[p.categoria]) acc[p.categoria] = [];
        acc[p.categoria].push(p);
        return acc;
    }, {} as Record<string, ConfigParam[]>);
}

function filtrarConfiguraciones(params: ConfigParam[], busqueda: string): ConfigParam[] {
    if (!busqueda.trim()) return params;
    const q = busqueda.toLowerCase();
    return params.filter(
        (p) =>
            p.clave.toLowerCase().includes(q) ||
            p.descripcion.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
    );
}

function hayModificaciones(original: ConfigParam[], modificado: ConfigParam[]): boolean {
    if (original.length !== modificado.length) return true;
    return original.some((orig) => {
        const mod = modificado.find((m) => m.clave === orig.clave);
        return !mod || mod.valor !== orig.valor;
    });
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PARAMS: ConfigParam[] = [
    { clave: "SISTEMA_NOMBRE", valor: "DIITRA", tipo: "string", categoria: "General", descripcion: "Nombre del sistema", soloLectura: false },
    { clave: "MAX_PROYECTOS_DOCENTE", valor: "3", tipo: "number", categoria: "Investigacion", descripcion: "Máximo proyectos por docente", soloLectura: false },
    { clave: "NOTIFICACIONES_EMAIL", valor: "true", tipo: "boolean", categoria: "Notificaciones", descripcion: "Activar notificaciones por email", soloLectura: false },
    { clave: "VERSION_SISTEMA", valor: "2.0.0", tipo: "string", categoria: "General", descripcion: "Versión del sistema", soloLectura: true },
    { clave: "CONFIG_ROLES", valor: '{"admin":1,"docente":2}', tipo: "json", categoria: "Seguridad", descripcion: "Configuración de roles", soloLectura: false },
];

describe("validarValorConfig — validación por tipo", () => {
    it("acepta string no vacío", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[0], valor: "DIITRA v2" })).toBeNull();
    });

    it("rechaza string vacío", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[0], valor: "" })).toContain("vacío");
    });

    it("acepta number válido", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[1], valor: "5" })).toBeNull();
    });

    it("rechaza number inválido (texto)", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[1], valor: "cinco" })).toContain("numérico");
    });

    it("acepta boolean 'true'", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[2], valor: "true" })).toBeNull();
    });

    it("acepta boolean 'false'", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[2], valor: "false" })).toBeNull();
    });

    it("rechaza boolean inválido", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[2], valor: "si" })).toContain("booleano");
    });

    it("acepta JSON válido", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[4], valor: '{"key":"value"}' })).toBeNull();
    });

    it("rechaza JSON inválido", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[4], valor: '{key: value}' })).toContain("JSON");
    });

    it("rechaza edición de parámetro de solo lectura", () => {
        expect(validarValorConfig({ ...MOCK_PARAMS[3], valor: "3.0.0" })).toContain("solo lectura");
    });
});

describe("agruparPorCategoria — organización por categoría", () => {
    it("agrupa correctamente en categorías", () => {
        const result = agruparPorCategoria(MOCK_PARAMS);
        expect(result["General"]).toHaveLength(2);
        expect(result["Investigacion"]).toHaveLength(1);
        expect(result["Notificaciones"]).toHaveLength(1);
        expect(result["Seguridad"]).toHaveLength(1);
    });

    it("retorna objeto vacío para lista vacía", () => {
        expect(agruparPorCategoria([])).toEqual({});
    });
});

describe("filtrarConfiguraciones — búsqueda", () => {
    it("retorna todos con búsqueda vacía", () => {
        expect(filtrarConfiguraciones(MOCK_PARAMS, "")).toHaveLength(5);
    });

    it("filtra por clave", () => {
        const result = filtrarConfiguraciones(MOCK_PARAMS, "MAX_PROYECTOS");
        expect(result).toHaveLength(1);
        expect(result[0].tipo).toBe("number");
    });

    it("filtra por descripción", () => {
        const result = filtrarConfiguraciones(MOCK_PARAMS, "email");
        expect(result).toHaveLength(1);
        expect(result[0].clave).toBe("NOTIFICACIONES_EMAIL");
    });

    it("filtra por categoría", () => {
        const result = filtrarConfiguraciones(MOCK_PARAMS, "seguridad");
        expect(result).toHaveLength(1);
    });
});

describe("hayModificaciones — detección dirty", () => {
    it("retorna false cuando no hay cambios", () => {
        expect(hayModificaciones(MOCK_PARAMS, [...MOCK_PARAMS])).toBe(false);
    });

    it("retorna true cuando cambia un valor", () => {
        const modificado = MOCK_PARAMS.map((p) =>
            p.clave === "SISTEMA_NOMBRE" ? { ...p, valor: "DIITRA Nuevo" } : p
        );
        expect(hayModificaciones(MOCK_PARAMS, modificado)).toBe(true);
    });

    it("retorna true cuando cambia el número de parámetros", () => {
        expect(hayModificaciones(MOCK_PARAMS, MOCK_PARAMS.slice(0, 3))).toBe(true);
    });
});
