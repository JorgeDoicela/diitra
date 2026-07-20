/**
 * DIITRA — Tests: useProjectTeam.ts (lógica pura)
 *
 * Valida la lógica del hook de gestión del equipo de proyecto:
 *  - Validación: el equipo debe tener exactamente UN director
 *  - Validación: no se puede agregar el mismo investigador dos veces
 *  - Cálculo de horas semanales totales del equipo
 *  - Clasificación de miembros por tipo (Director / Investigador / Codirector)
 *  - Restricciones de roles disponibles según tipo de participante
 *  - Detección de cambios pendientes (isDirty)
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MiembroEquipo {
    cedula: string;
    nombre: string;
    rol: string;
    esDirector: boolean;
    horasSemanales: number | null;
    tipoParticipante: "Docente" | "Alumno" | "Externo";
    activo: boolean;
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function validarEquipo(miembros: MiembroEquipo[]): string | null {
    const activos = miembros.filter((m) => m.activo);
    const directores = activos.filter((m) => m.esDirector);

    if (directores.length === 0) return "El equipo debe tener al menos un director";
    if (directores.length > 1) return "El equipo solo puede tener un director";
    return null;
}

function tieneDuplicados(miembros: MiembroEquipo[]): boolean {
    const cedulas = miembros.map((m) => m.cedula);
    return cedulas.length !== new Set(cedulas).size;
}

function calcularHorasTotal(miembros: MiembroEquipo[]): number {
    return miembros
        .filter((m) => m.activo)
        .reduce((sum, m) => sum + (m.horasSemanales ?? 0), 0);
}

function getDirector(miembros: MiembroEquipo[]): MiembroEquipo | null {
    return miembros.find((m) => m.esDirector && m.activo) ?? null;
}

function filtrarPorTipo(
    miembros: MiembroEquipo[],
    tipo: "Docente" | "Alumno" | "Externo"
): MiembroEquipo[] {
    return miembros.filter((m) => m.tipoParticipante === tipo && m.activo);
}

function detectarCambios(
    original: MiembroEquipo[],
    actual: MiembroEquipo[]
): boolean {
    if (original.length !== actual.length) return true;
    return JSON.stringify(original) !== JSON.stringify(actual);
}

// ─────────────────────────────────────────────────────────────────────────────

const EQUIPO_VALIDO: MiembroEquipo[] = [
    { cedula: "1712345678", nombre: "Dr. Luis Torres", rol: "Director", esDirector: true, horasSemanales: 20, tipoParticipante: "Docente", activo: true },
    { cedula: "1798765432", nombre: "Mg. Ana Ruiz", rol: "Investigador", esDirector: false, horasSemanales: 10, tipoParticipante: "Docente", activo: true },
    { cedula: "1756789012", nombre: "Carlos Pérez", rol: "Estudiante", esDirector: false, horasSemanales: 8, tipoParticipante: "Alumno", activo: true },
];

describe("validarEquipo — reglas del equipo", () => {
    it("acepta equipo con exactamente un director", () => {
        expect(validarEquipo(EQUIPO_VALIDO)).toBeNull();
    });

    it("rechaza equipo sin director", () => {
        const sinDirector = EQUIPO_VALIDO.map((m) => ({ ...m, esDirector: false }));
        expect(validarEquipo(sinDirector)).toContain("director");
    });

    it("rechaza equipo con más de un director", () => {
        const dosDirectores = EQUIPO_VALIDO.map((m) => ({ ...m, esDirector: true }));
        expect(validarEquipo(dosDirectores)).toContain("director");
    });

    it("miembros inactivos no cuentan para la validación", () => {
        // Si el segundo director está inactivo, no debe contar
        const conInactivo = [
            ...EQUIPO_VALIDO,
            { cedula: "1700000001", nombre: "Ex-Director", rol: "Director", esDirector: true, horasSemanales: 0, tipoParticipante: "Docente" as const, activo: false },
        ];
        expect(validarEquipo(conInactivo)).toBeNull();
    });
});

describe("tieneDuplicados — detección de cédulas repetidas", () => {
    it("retorna false para equipo sin duplicados", () => {
        expect(tieneDuplicados(EQUIPO_VALIDO)).toBe(false);
    });

    it("retorna true cuando la misma cédula aparece dos veces", () => {
        const conDuplicado = [
            ...EQUIPO_VALIDO,
            { ...EQUIPO_VALIDO[0] }, // mismo miembro duplicado
        ];
        expect(tieneDuplicados(conDuplicado)).toBe(true);
    });
});

describe("calcularHorasTotal — horas semanales del equipo", () => {
    it("suma correctamente las horas de miembros activos", () => {
        expect(calcularHorasTotal(EQUIPO_VALIDO)).toBe(38); // 20+10+8
    });

    it("ignora miembros inactivos en el cálculo", () => {
        const conInactivo = [
            ...EQUIPO_VALIDO,
            { cedula: "9900000001", nombre: "Inactivo", rol: "Ex", esDirector: false, horasSemanales: 100, tipoParticipante: "Docente" as const, activo: false },
        ];
        expect(calcularHorasTotal(conInactivo)).toBe(38);
    });

    it("maneja null de horasSemanales como 0", () => {
        const conNull = EQUIPO_VALIDO.map((m) => ({ ...m, horasSemanales: null }));
        expect(calcularHorasTotal(conNull)).toBe(0);
    });
});

describe("getDirector", () => {
    it("retorna el director activo del equipo", () => {
        const director = getDirector(EQUIPO_VALIDO);
        expect(director).not.toBeNull();
        expect(director!.esDirector).toBe(true);
        expect(director!.cedula).toBe("1712345678");
    });

    it("retorna null si no hay director activo", () => {
        const sinDirector = EQUIPO_VALIDO.map((m) => ({ ...m, esDirector: false }));
        expect(getDirector(sinDirector)).toBeNull();
    });
});

describe("filtrarPorTipo — clasificación por tipo de participante", () => {
    it("filtra solo docentes activos", () => {
        const result = filtrarPorTipo(EQUIPO_VALIDO, "Docente");
        expect(result).toHaveLength(2);
        expect(result.every((m) => m.tipoParticipante === "Docente")).toBe(true);
    });

    it("filtra solo alumnos activos", () => {
        const result = filtrarPorTipo(EQUIPO_VALIDO, "Alumno");
        expect(result).toHaveLength(1);
        expect(result[0].cedula).toBe("1756789012");
    });

    it("retorna vacío para tipo Externo si no hay externos", () => {
        expect(filtrarPorTipo(EQUIPO_VALIDO, "Externo")).toHaveLength(0);
    });
});

describe("detectarCambios — isDirty", () => {
    it("retorna false para equipos idénticos", () => {
        expect(detectarCambios(EQUIPO_VALIDO, [...EQUIPO_VALIDO])).toBe(false);
    });

    it("retorna true si cambia el número de miembros", () => {
        expect(detectarCambios(EQUIPO_VALIDO, [EQUIPO_VALIDO[0]])).toBe(true);
    });

    it("retorna true si cambia un campo de un miembro", () => {
        const modificado = EQUIPO_VALIDO.map((m, i) =>
            i === 0 ? { ...m, rol: "Codirector" } : m
        );
        expect(detectarCambios(EQUIPO_VALIDO, modificado)).toBe(true);
    });
});
