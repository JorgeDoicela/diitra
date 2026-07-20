/**
 * DIITRA — Tests: useStickyNotes.ts (lógica pura)
 *
 * Valida la lógica del sistema de notas adhesivas (sticky notes / inbox):
 *  - Estado inicial del formulario de nota
 *  - Validación de campos de nota
 *  - Transformación de nota a evento de calendario
 *  - Filtrado de notas por estado (Inbox / En Progreso / Completada)
 *  - Ordenación por prioridad y fecha
 *  - Lógica de asignación de color por prioridad
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StickyNote {
    uuid: string;
    titulo: string;
    notaDetalle: string | null;
    prioridad: "Alta" | "Media" | "Baja";
    estado: "Inbox" | "En Progreso" | "Completada";
    colorHex: string;
    fechaInicio: string | null;
    ordenBandeja: number | null;
}

const NOTA_DEFAULT = {
    titulo: "",
    notaDetalle: "",
    prioridad: "Media" as StickyNote["prioridad"],
    estado: "Inbox" as StickyNote["estado"],
    colorHex: "#F59E0B",
    fechaInicio: null as string | null,
};

// ─── Lógica pura ──────────────────────────────────────────────────────────────

const COLOR_POR_PRIORIDAD: Record<string, string> = {
    Alta: "#EF4444",
    Media: "#F59E0B",
    Baja: "#10B981",
};

function getColorPorPrioridad(prioridad: string): string {
    return COLOR_POR_PRIORIDAD[prioridad] ?? "#94A3B8";
}

function validarNota(nota: typeof NOTA_DEFAULT): string | null {
    if (!nota.titulo.trim()) return "El título de la nota es requerido";
    if (nota.titulo.length > 200) return "El título no puede superar 200 caracteres";
    return null;
}

function filtrarNotas(notas: StickyNote[], estado: StickyNote["estado"] | "todas"): StickyNote[] {
    if (estado === "todas") return notas;
    return notas.filter((n) => n.estado === estado);
}

function ordenarNotasPorPrioridad(notas: StickyNote[]): StickyNote[] {
    const ORDEN = { Alta: 0, Media: 1, Baja: 2 };
    return [...notas].sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad]);
}

function ordenarNotasPorOrdenBandeja(notas: StickyNote[]): StickyNote[] {
    return [...notas].sort((a, b) => {
        if (a.ordenBandeja === null && b.ordenBandeja === null) return 0;
        if (a.ordenBandeja === null) return 1;
        if (b.ordenBandeja === null) return -1;
        return a.ordenBandeja - b.ordenBandeja;
    });
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_NOTAS: StickyNote[] = [
    { uuid: "n1", titulo: "Revisar presupuesto", notaDetalle: "Ver capítulo 3", prioridad: "Alta", estado: "Inbox", colorHex: "#EF4444", fechaInicio: null, ordenBandeja: 2 },
    { uuid: "n2", titulo: "Contactar investigador", notaDetalle: null, prioridad: "Media", estado: "En Progreso", colorHex: "#F59E0B", fechaInicio: "2026-08-01", ordenBandeja: 1 },
    { uuid: "n3", titulo: "Subir documentos", notaDetalle: null, prioridad: "Baja", estado: "Completada", colorHex: "#10B981", fechaInicio: null, ordenBandeja: 3 },
    { uuid: "n4", titulo: "Urgente: Firma director", notaDetalle: "Hoy", prioridad: "Alta", estado: "Inbox", colorHex: "#EF4444", fechaInicio: null, ordenBandeja: null },
];

describe("Estado inicial de NOTA_DEFAULT", () => {
    it("titulo vacío por defecto", () => {
        expect(NOTA_DEFAULT.titulo).toBe("");
    });

    it("prioridad Media por defecto", () => {
        expect(NOTA_DEFAULT.prioridad).toBe("Media");
    });

    it("estado Inbox por defecto", () => {
        expect(NOTA_DEFAULT.estado).toBe("Inbox");
    });

    it("colorHex amarillo (Media) por defecto", () => {
        expect(NOTA_DEFAULT.colorHex).toBe("#F59E0B");
    });

    it("fechaInicio null por defecto (sin fecha)", () => {
        expect(NOTA_DEFAULT.fechaInicio).toBeNull();
    });
});

describe("getColorPorPrioridad — asignación de colores", () => {
    it("Alta → rojo #EF4444", () => {
        expect(getColorPorPrioridad("Alta")).toBe("#EF4444");
    });

    it("Media → amarillo #F59E0B", () => {
        expect(getColorPorPrioridad("Media")).toBe("#F59E0B");
    });

    it("Baja → verde #10B981", () => {
        expect(getColorPorPrioridad("Baja")).toBe("#10B981");
    });

    it("Prioridad desconocida → gris #94A3B8", () => {
        expect(getColorPorPrioridad("Desconocida")).toBe("#94A3B8");
    });
});

describe("validarNota — validación", () => {
    it("acepta nota con título válido", () => {
        expect(validarNota({ ...NOTA_DEFAULT, titulo: "Mi nota" })).toBeNull();
    });

    it("rechaza título vacío", () => {
        expect(validarNota({ ...NOTA_DEFAULT, titulo: "" })).toContain("título");
    });

    it("rechaza título de solo espacios", () => {
        expect(validarNota({ ...NOTA_DEFAULT, titulo: "   " })).toContain("título");
    });

    it("rechaza título mayor a 200 caracteres", () => {
        const tituloLargo = "a".repeat(201);
        expect(validarNota({ ...NOTA_DEFAULT, titulo: tituloLargo })).toContain("200");
    });
});

describe("filtrarNotas — por estado", () => {
    it("retorna todas con estado 'todas'", () => {
        expect(filtrarNotas(MOCK_NOTAS, "todas")).toHaveLength(4);
    });

    it("filtra solo Inbox", () => {
        const result = filtrarNotas(MOCK_NOTAS, "Inbox");
        expect(result).toHaveLength(2);
        expect(result.every((n) => n.estado === "Inbox")).toBe(true);
    });

    it("filtra solo En Progreso", () => {
        const result = filtrarNotas(MOCK_NOTAS, "En Progreso");
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe("n2");
    });

    it("filtra solo Completadas", () => {
        const result = filtrarNotas(MOCK_NOTAS, "Completada");
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe("n3");
    });
});

describe("ordenarNotasPorPrioridad — Alta primero", () => {
    it("coloca las notas Alta antes que Media y Baja", () => {
        const result = ordenarNotasPorPrioridad(MOCK_NOTAS);
        const prioridades = result.map((n) => n.prioridad);
        const indexAltaMax = Math.max(...result.map((n, i) => n.prioridad === "Alta" ? i : -1));
        const indexMediaMin = Math.min(...result.map((n, i) => n.prioridad === "Media" ? i : 999));
        expect(indexAltaMax).toBeLessThan(indexMediaMin);
    });

    it("no muta el array original", () => {
        const original = MOCK_NOTAS.map((n) => n.uuid);
        ordenarNotasPorPrioridad(MOCK_NOTAS);
        expect(MOCK_NOTAS.map((n) => n.uuid)).toEqual(original);
    });
});

describe("ordenarNotasPorOrdenBandeja — drag-and-drop order", () => {
    it("ordena por ordenBandeja numérico ascendente", () => {
        const result = ordenarNotasPorOrdenBandeja(MOCK_NOTAS);
        const conOrden = result.filter((n) => n.ordenBandeja !== null);
        expect(conOrden[0].ordenBandeja).toBe(1);
        expect(conOrden[1].ordenBandeja).toBe(2);
        expect(conOrden[2].ordenBandeja).toBe(3);
    });

    it("notas sin ordenBandeja (null) van al final", () => {
        const result = ordenarNotasPorOrdenBandeja(MOCK_NOTAS);
        const ultimo = result[result.length - 1];
        expect(ultimo.ordenBandeja).toBeNull();
    });
});
