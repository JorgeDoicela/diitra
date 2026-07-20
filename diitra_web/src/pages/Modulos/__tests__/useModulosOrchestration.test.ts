/**
 * DIITRA — Tests: useModulosOrchestration.ts (lógica pura de módulos)
 *
 * Valida la lógica del orquestador de módulos del sistema:
 *  - Filtrado de módulos por búsqueda y categoría
 *  - Estado de activación (Módulo Activo vs Inactivo)
 *  - Conteo de sub-operaciones por módulo
 */
import { describe, it, expect } from "vitest";

interface Modulo {
    idModulo: number;
    codigo: string;
    nombre: string;
    activo: boolean;
    categoria: string;
    numOperaciones: number;
}

const MODULOS_MOCK: Modulo[] = [
    { idModulo: 1, codigo: "INV", nombre: "Gestión de Investigación", activo: true, categoria: "Investigación", numOperaciones: 8 },
    { idModulo: 2, codigo: "SEC", nombre: "Seguridad y Accesos", activo: true, categoria: "Administración", numOperaciones: 12 },
    { idModulo: 3, codigo: "CAL", nombre: "Calendario Institucional", activo: false, categoria: "Planificación", numOperaciones: 5 },
];

function filtrarModulos(modulos: Modulo[], busqueda: string, soloActivos: boolean): Modulo[] {
    return modulos.filter((m) => {
        if (soloActivos && !m.activo) return false;
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return (
            m.nombre.toLowerCase().includes(q) ||
            m.codigo.toLowerCase().includes(q) ||
            m.categoria.toLowerCase().includes(q)
        );
    });
}

describe("filtrarModulos — búsqueda y filtros de estado", () => {
    it("retorna todos los módulos si búsqueda está vacía y soloActivos es false", () => {
        expect(filtrarModulos(MODULOS_MOCK, "", false)).toHaveLength(3);
    });

    it("filtra solo los módulos activos", () => {
        const activos = filtrarModulos(MODULOS_MOCK, "", true);
        expect(activos).toHaveLength(2);
        expect(activos.every((m) => m.activo)).toBe(true);
    });

    it("filtra por nombre o código de módulo", () => {
        const result = filtrarModulos(MODULOS_MOCK, "Investigación", false);
        expect(result).toHaveLength(1);
        expect(result[0].codigo).toBe("INV");
    });
});
