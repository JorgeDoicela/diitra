/**
 * DIITRA — Tests: useConvocatorias.ts (lógica pura)
 *
 * Valida la lógica de negocio de convocatorias:
 *  - Filtrado por estado (Abierta / Cerrada / Todas)
 *  - Ordenación por fecha de cierre
 *  - Cálculo de días restantes hasta el cierre
 *  - Clasificación de urgencia (alta/media/baja) según días restantes
 *  - Estado del formulario de nueva convocatoria
 *  - Validación de campos requeridos
 */
import { describe, it, expect } from "vitest";

// ─── Tipos replicados del hook ────────────────────────────────────────────────

interface Convocatoria {
    idConvocatoria: number;
    titulo: string;
    estado: string;
    activo: boolean;
    fechaPublicacion: string;
    fechaCierre: string | null;
}

// ─── Lógica pura replicada del hook ──────────────────────────────────────────

function filtrarConvocatorias(
    convocatorias: Convocatoria[],
    filtroEstado: "todas" | "abierta" | "cerrada"
): Convocatoria[] {
    if (filtroEstado === "todas") return convocatorias;
    return convocatorias.filter(
        (c) => c.estado.toLowerCase() === filtroEstado.toLowerCase()
    );
}

function calcularDiasRestantes(fechaCierre: string | null): number | null {
    if (!fechaCierre) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cierre = new Date(fechaCierre);
    cierre.setHours(0, 0, 0, 0);
    const diff = cierre.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calcularUrgencia(diasRestantes: number | null): "alta" | "media" | "baja" | null {
    if (diasRestantes === null) return null;
    if (diasRestantes <= 7) return "alta";
    if (diasRestantes <= 30) return "media";
    return "baja";
}

function ordenarPorFechaCierre(convocatorias: Convocatoria[]): Convocatoria[] {
    return [...convocatorias].sort((a, b) => {
        if (!a.fechaCierre && !b.fechaCierre) return 0;
        if (!a.fechaCierre) return 1;
        if (!b.fechaCierre) return -1;
        return new Date(a.fechaCierre).getTime() - new Date(b.fechaCierre).getTime();
    });
}

const FORM_DEFAULT = {
    titulo: "",
    descripcion: "",
    estado: "Abierta",
    fechaPublicacion: "",
    fechaCierre: "",
    lineaInvestigacion: "",
    tipoInvestigacion: "",
    montoMaximo: "" as number | "",
    requisitos: "",
};

function validarConvocatoria(form: typeof FORM_DEFAULT): string | null {
    if (!form.titulo.trim()) return "El título es requerido";
    if (!form.fechaPublicacion) return "La fecha de publicación es requerida";
    if (form.fechaCierre && form.fechaPublicacion > form.fechaCierre)
        return "La fecha de cierre no puede ser anterior a la fecha de publicación";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CONVOCATORIAS: Convocatoria[] = [
    {
        idConvocatoria: 1,
        titulo: "Convocatoria Ciencias 2026",
        estado: "Abierta",
        activo: true,
        fechaPublicacion: "2026-06-01",
        fechaCierre: "2026-08-01",
    },
    {
        idConvocatoria: 2,
        titulo: "Convocatoria Innovación 2025",
        estado: "Cerrada",
        activo: true,
        fechaPublicacion: "2025-01-01",
        fechaCierre: "2025-06-30",
    },
    {
        idConvocatoria: 3,
        titulo: "Convocatoria Tecnología 2026",
        estado: "Abierta",
        activo: true,
        fechaPublicacion: "2026-07-01",
        fechaCierre: "2026-09-15",
    },
];

describe("filtrarConvocatorias — filtrado por estado", () => {
    it("retorna todas cuando filtro es 'todas'", () => {
        expect(filtrarConvocatorias(MOCK_CONVOCATORIAS, "todas")).toHaveLength(3);
    });

    it("retorna solo las abiertas cuando filtro es 'abierta'", () => {
        const result = filtrarConvocatorias(MOCK_CONVOCATORIAS, "abierta");
        expect(result).toHaveLength(2);
        expect(result.every((c) => c.estado === "Abierta")).toBe(true);
    });

    it("retorna solo las cerradas cuando filtro es 'cerrada'", () => {
        const result = filtrarConvocatorias(MOCK_CONVOCATORIAS, "cerrada");
        expect(result).toHaveLength(1);
        expect(result[0].titulo).toBe("Convocatoria Innovación 2025");
    });

    it("retorna lista vacía cuando no hay coincidencias", () => {
        const result = filtrarConvocatorias([], "abierta");
        expect(result).toHaveLength(0);
    });
});

describe("calcularDiasRestantes — cálculo de días hasta el cierre", () => {
    it("retorna null si no hay fecha de cierre", () => {
        expect(calcularDiasRestantes(null)).toBeNull();
    });

    it("retorna 0 o -1 para fecha de hoy (puede variar según hora exacta)", () => {
        const hoy = new Date();
        const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
        const result = calcularDiasRestantes(fechaLocal);
        // El resultado para "hoy" es 0 o -1 depend. de los milisegundos de la hora actual
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(0);
    });

    it("retorna entre 9 y 10 para fecha en 10 días (variación por hora)", () => {
        const futuro = new Date();
        futuro.setDate(futuro.getDate() + 10);
        const fechaLocal = `${futuro.getFullYear()}-${String(futuro.getMonth() + 1).padStart(2, "0")}-${String(futuro.getDate()).padStart(2, "0")}`;
        const result = calcularDiasRestantes(fechaLocal);
        expect(result).toBeGreaterThanOrEqual(9);
        expect(result).toBeLessThanOrEqual(10);
    });

    it("retorna número negativo para fecha pasada", () => {
        const pasado = new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0];
        const result = calcularDiasRestantes(pasado);
        expect(result).toBeLessThan(0);
    });
});

describe("calcularUrgencia — clasificación de urgencia", () => {
    it("alta urgencia para 7 días o menos", () => {
        expect(calcularUrgencia(7)).toBe("alta");
        expect(calcularUrgencia(1)).toBe("alta");
        expect(calcularUrgencia(0)).toBe("alta");
    });

    it("media urgencia para 8-30 días", () => {
        expect(calcularUrgencia(8)).toBe("media");
        expect(calcularUrgencia(30)).toBe("media");
        expect(calcularUrgencia(15)).toBe("media");
    });

    it("baja urgencia para más de 30 días", () => {
        expect(calcularUrgencia(31)).toBe("baja");
        expect(calcularUrgencia(90)).toBe("baja");
    });

    it("null si los días son null", () => {
        expect(calcularUrgencia(null)).toBeNull();
    });
});

describe("ordenarPorFechaCierre — orden cronológico", () => {
    it("ordena por fecha de cierre ascendente", () => {
        const result = ordenarPorFechaCierre(MOCK_CONVOCATORIAS);
        // La cerrada (2025) viene primero, luego la de agosto, luego la de septiembre
        expect(result[0].idConvocatoria).toBe(2); // 2025-06-30
        expect(result[1].idConvocatoria).toBe(1); // 2026-08-01
        expect(result[2].idConvocatoria).toBe(3); // 2026-09-15
    });

    it("convocatorias sin fecha de cierre van al final", () => {
        const conSinFecha: Convocatoria[] = [
            { idConvocatoria: 10, titulo: "Con fecha", estado: "Abierta", activo: true, fechaPublicacion: "2026-01-01", fechaCierre: "2026-12-31" },
            { idConvocatoria: 11, titulo: "Sin fecha", estado: "Abierta", activo: true, fechaPublicacion: "2026-01-01", fechaCierre: null },
        ];
        const result = ordenarPorFechaCierre(conSinFecha);
        expect(result[0].idConvocatoria).toBe(10);
        expect(result[1].idConvocatoria).toBe(11);
    });

    it("no muta el array original", () => {
        const original = [...MOCK_CONVOCATORIAS];
        ordenarPorFechaCierre(MOCK_CONVOCATORIAS);
        expect(MOCK_CONVOCATORIAS).toEqual(original);
    });
});

describe("validarConvocatoria — validación del formulario", () => {
    it("acepta formulario completo y válido", () => {
        const form = {
            ...FORM_DEFAULT,
            titulo: "Convocatoria Test",
            fechaPublicacion: "2026-07-01",
            fechaCierre: "2026-09-01",
        };
        expect(validarConvocatoria(form)).toBeNull();
    });

    it("rechaza título vacío", () => {
        const form = { ...FORM_DEFAULT, titulo: "" };
        expect(validarConvocatoria(form)).toContain("título");
    });

    it("rechaza título de solo espacios", () => {
        const form = { ...FORM_DEFAULT, titulo: "   " };
        expect(validarConvocatoria(form)).toContain("título");
    });

    it("rechaza cuando fecha de cierre es anterior a publicación", () => {
        const form = {
            ...FORM_DEFAULT,
            titulo: "Test",
            fechaPublicacion: "2026-09-01",
            fechaCierre: "2026-08-01",
        };
        expect(validarConvocatoria(form)).toContain("cierre");
    });

    it("acepta convocatoria sin fecha de cierre", () => {
        const form = {
            ...FORM_DEFAULT,
            titulo: "Convocatoria Abierta",
            fechaPublicacion: "2026-07-01",
            fechaCierre: "",
        };
        expect(validarConvocatoria(form)).toBeNull();
    });
});
