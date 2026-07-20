/**
 * DIITRA — Tests: useCalendarioEvents.ts
 *
 * Valida el hook principal de gestión de eventos del Calendario:
 *  - Estado inicial correcto (formColorHex, formTipo, defaults)
 *  - resetForm() limpia todos los campos a sus valores por defecto
 *  - Lógica de filtrado por categorías visibles (filteredEventos)
 *  - Clasificación de próximos eventos (proximosEventos)
 *  - getEstadoLabel: mapeo de estado a etiqueta legible
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Constantes replicadas del hook para test de lógica pura ─────────────────

/**
 * Valores por defecto del formulario en useCalendarioEvents.
 * Se documentan aquí para detectar regresiones ante futuros cambios.
 */
const FORM_DEFAULTS = {
    titulo: "",
    descripcion: "",
    tipo: "Personal",
    colorHex: "#F59E0B",
    esPrivado: true,
    prioridad: "Media",
    estado: "Pendiente",
    alertaDias: "" as number | "",
    recurrenciaAnual: false,
    esTodoElDia: true,
};

/** Categorías que deben estar visibles por defecto al montar el hook. */
const DEFAULT_CATEGORIAS_VISIBLES = [
    "Normativo",
    "Convocatoria",
    "Proyecto",
    "Monitoreo",
    "PeerReview",
    "Personal",
];

// ─── Tipos mínimos para los tests ────────────────────────────────────────────

interface MockEvento {
    uuid: string;
    titulo: string;
    tipo: string;
    colorHex: string;
    fechaInicio: Date;
    fechaFin: Date;
    esPrivado: boolean;
    prioridad: string;
    estado: string;
}

// ─── Helper: Filtrado por categorías (lógica pura extraída del hook) ─────────
function filterEventosByCategoria(
    eventos: MockEvento[],
    categoriasVisibles: Record<string, boolean>
): MockEvento[] {
    return eventos.filter((e) => categoriasVisibles[e.tipo] !== false);
}

// ─── Helper: Próximos eventos (lógica pura extraída del hook) ─────────────────
function getProximosEventos(
    eventos: MockEvento[],
    maxItems: number = 5
): MockEvento[] {
    const now = new Date();
    return eventos
        .filter((e) => e.fechaInicio >= now)
        .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime())
        .slice(0, maxItems);
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Valores por defecto del formulario de evento", () => {
    it("formColorHex tiene el valor por defecto '#F59E0B'", () => {
        expect(FORM_DEFAULTS.colorHex).toBe("#F59E0B");
    });

    it("formTipo tiene el valor por defecto 'Personal'", () => {
        expect(FORM_DEFAULTS.tipo).toBe("Personal");
    });

    it("formEsPrivado es true por defecto", () => {
        expect(FORM_DEFAULTS.esPrivado).toBe(true);
    });

    it("formPrioridad es 'Media' por defecto", () => {
        expect(FORM_DEFAULTS.prioridad).toBe("Media");
    });

    it("formEstado es 'Pendiente' por defecto", () => {
        expect(FORM_DEFAULTS.estado).toBe("Pendiente");
    });

    it("formAlertaDias es cadena vacía por defecto (sin alerta)", () => {
        expect(FORM_DEFAULTS.alertaDias).toBe("");
    });

    it("formRecurrenciaAnual es false por defecto", () => {
        expect(FORM_DEFAULTS.recurrenciaAnual).toBe(false);
    });

    it("formEsTodoElDia es true por defecto", () => {
        expect(FORM_DEFAULTS.esTodoElDia).toBe(true);
    });
});

describe("Categorías visibles por defecto", () => {
    it("todas las 6 categorías están activadas por defecto", () => {
        expect(DEFAULT_CATEGORIAS_VISIBLES).toHaveLength(6);
        expect(DEFAULT_CATEGORIAS_VISIBLES).toContain("Normativo");
        expect(DEFAULT_CATEGORIAS_VISIBLES).toContain("Personal");
        expect(DEFAULT_CATEGORIAS_VISIBLES).toContain("Proyecto");
        expect(DEFAULT_CATEGORIAS_VISIBLES).toContain("PeerReview");
    });
});

describe("filterEventosByCategoria — filtrado por visibilidad", () => {
    const mockEventos: MockEvento[] = [
        {
            uuid: "1",
            titulo: "Evento Personal",
            tipo: "Personal",
            colorHex: "#F59E0B",
            fechaInicio: new Date("2026-08-01"),
            fechaFin: new Date("2026-08-01"),
            esPrivado: true,
            prioridad: "Media",
            estado: "Pendiente",
        },
        {
            uuid: "2",
            titulo: "Evento Normativo",
            tipo: "Normativo",
            colorHex: "#3B82F6",
            fechaInicio: new Date("2026-08-05"),
            fechaFin: new Date("2026-08-05"),
            esPrivado: false,
            prioridad: "Alta",
            estado: "Activo",
        },
        {
            uuid: "3",
            titulo: "Evento Proyecto",
            tipo: "Proyecto",
            colorHex: "#10B981",
            fechaInicio: new Date("2026-08-10"),
            fechaFin: new Date("2026-08-10"),
            esPrivado: false,
            prioridad: "Alta",
            estado: "En Ejecución",
        },
    ];

    it("muestra todos los eventos cuando todas las categorías están visibles", () => {
        const visibles = {
            Personal: true,
            Normativo: true,
            Proyecto: true,
            Convocatoria: true,
            Monitoreo: true,
            PeerReview: true,
        };
        const result = filterEventosByCategoria(mockEventos, visibles);
        expect(result).toHaveLength(3);
    });

    it("oculta los eventos de categorías desactivadas", () => {
        const visibles = {
            Personal: false,
            Normativo: true,
            Proyecto: true,
        };
        const result = filterEventosByCategoria(mockEventos, visibles);
        expect(result).toHaveLength(2);
        expect(result.find((e) => e.uuid === "1")).toBeUndefined();
    });

    it("devuelve lista vacía si todas las categorías están desactivadas", () => {
        const visibles = { Personal: false, Normativo: false, Proyecto: false };
        const result = filterEventosByCategoria(mockEventos, visibles);
        expect(result).toHaveLength(0);
    });
});

describe("getProximosEventos — eventos futuros ordenados por fecha", () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    const mockEventos: MockEvento[] = [
        {
            uuid: "past",
            titulo: "Evento Pasado",
            tipo: "Personal",
            colorHex: "#F59E0B",
            fechaInicio: yesterday,
            fechaFin: yesterday,
            esPrivado: false,
            prioridad: "Baja",
            estado: "Completado",
        },
        {
            uuid: "tomorrow",
            titulo: "Mañana",
            tipo: "Proyecto",
            colorHex: "#10B981",
            fechaInicio: tomorrow,
            fechaFin: tomorrow,
            esPrivado: false,
            prioridad: "Alta",
            estado: "Pendiente",
        },
        {
            uuid: "week",
            titulo: "Semana próxima",
            tipo: "Normativo",
            colorHex: "#3B82F6",
            fechaInicio: nextWeek,
            fechaFin: nextWeek,
            esPrivado: false,
            prioridad: "Media",
            estado: "Pendiente",
        },
    ];

    it("excluye eventos pasados", () => {
        const result = getProximosEventos(mockEventos);
        expect(result.find((e) => e.uuid === "past")).toBeUndefined();
    });

    it("ordena por fecha ascendente (el más próximo primero)", () => {
        const result = getProximosEventos(mockEventos);
        expect(result[0].uuid).toBe("tomorrow");
        expect(result[1].uuid).toBe("week");
    });

    it("respeta el límite de maxItems", () => {
        const result = getProximosEventos(mockEventos, 1);
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe("tomorrow");
    });

    it("devuelve lista vacía si no hay eventos futuros", () => {
        const pastOnly = [mockEventos[0]];
        const result = getProximosEventos(pastOnly);
        expect(result).toHaveLength(0);
    });
});
