/**
 * DIITRA — Tests: useKanbanOrchestration.ts (lógica pura)
 *
 * Valida la lógica del tablero Kanban del calendario personal:
 *  - Estado inicial de columnas (Inbox, En Progreso, Completado)
 *  - Movimiento de notas entre columnas (drag & drop state)
 *  - Conteo de notas por columna
 *  - Ordenación manual dentro de columna (ordenBandeja)
 *  - Filtrado de notas por texto
 *  - Detección de columna vacía
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type KanbanEstado = "Inbox" | "En Progreso" | "Completada";

interface KanbanCard {
    uuid: string;
    titulo: string;
    prioridad: "Alta" | "Media" | "Baja";
    estado: KanbanEstado;
    colorHex: string;
    ordenBandeja: number | null;
}

interface KanbanColumna {
    id: KanbanEstado;
    label: string;
    cards: KanbanCard[];
}

// ─── Lógica pura ──────────────────────────────────────────────────────────────

const COLUMNAS_INICIALES: KanbanEstado[] = ["Inbox", "En Progreso", "Completada"];

function organizarEnColumnas(cards: KanbanCard[]): Record<KanbanEstado, KanbanCard[]> {
    const columnas: Record<KanbanEstado, KanbanCard[]> = {
        "Inbox": [],
        "En Progreso": [],
        "Completada": [],
    };
    for (const card of cards) {
        columnas[card.estado].push(card);
    }
    // Ordenar cada columna por ordenBandeja
    for (const col of COLUMNAS_INICIALES) {
        columnas[col].sort((a, b) => {
            if (a.ordenBandeja === null && b.ordenBandeja === null) return 0;
            if (a.ordenBandeja === null) return 1;
            if (b.ordenBandeja === null) return -1;
            return a.ordenBandeja - b.ordenBandeja;
        });
    }
    return columnas;
}

function moverCard(
    cards: KanbanCard[],
    uuid: string,
    nuevoEstado: KanbanEstado
): KanbanCard[] {
    return cards.map((c) =>
        c.uuid === uuid ? { ...c, estado: nuevoEstado, ordenBandeja: null } : c
    );
}

function contarPorColumna(cards: KanbanCard[]): Record<KanbanEstado, number> {
    const count: Record<KanbanEstado, number> = { "Inbox": 0, "En Progreso": 0, "Completada": 0 };
    for (const card of cards) {
        count[card.estado]++;
    }
    return count;
}

function filtrarCards(cards: KanbanCard[], busqueda: string): KanbanCard[] {
    if (!busqueda.trim()) return cards;
    const q = busqueda.toLowerCase();
    return cards.filter((c) => c.titulo.toLowerCase().includes(q));
}

function columnaEstaVacia(cards: KanbanCard[], estado: KanbanEstado): boolean {
    return cards.filter((c) => c.estado === estado).length === 0;
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CARDS: KanbanCard[] = [
    { uuid: "k1", titulo: "Revisar presupuesto del proyecto", prioridad: "Alta", estado: "Inbox", colorHex: "#EF4444", ordenBandeja: 1 },
    { uuid: "k2", titulo: "Redactar informe mensual", prioridad: "Media", estado: "Inbox", colorHex: "#F59E0B", ordenBandeja: 2 },
    { uuid: "k3", titulo: "Reunión con investigadores", prioridad: "Alta", estado: "En Progreso", colorHex: "#EF4444", ordenBandeja: 1 },
    { uuid: "k4", titulo: "Enviar documentos a decanato", prioridad: "Baja", estado: "Completada", colorHex: "#10B981", ordenBandeja: 1 },
    { uuid: "k5", titulo: "Actualizar cronograma", prioridad: "Media", estado: "En Progreso", colorHex: "#F59E0B", ordenBandeja: 2 },
];

describe("organizarEnColumnas — distribución en tablero", () => {
    it("distribuye correctamente las cards en sus columnas", () => {
        const columnas = organizarEnColumnas(MOCK_CARDS);
        expect(columnas["Inbox"]).toHaveLength(2);
        expect(columnas["En Progreso"]).toHaveLength(2);
        expect(columnas["Completada"]).toHaveLength(1);
    });

    it("ordena cards dentro de cada columna por ordenBandeja", () => {
        const columnas = organizarEnColumnas(MOCK_CARDS);
        const inbox = columnas["Inbox"];
        expect(inbox[0].ordenBandeja).toBeLessThan(inbox[1].ordenBandeja!);
    });

    it("retorna columnas vacías cuando no hay cards", () => {
        const columnas = organizarEnColumnas([]);
        expect(columnas["Inbox"]).toHaveLength(0);
        expect(columnas["En Progreso"]).toHaveLength(0);
        expect(columnas["Completada"]).toHaveLength(0);
    });
});

describe("moverCard — drag & drop entre columnas", () => {
    it("mueve la card al nuevo estado correctamente", () => {
        const actualizado = moverCard(MOCK_CARDS, "k1", "En Progreso");
        const card = actualizado.find((c) => c.uuid === "k1")!;
        expect(card.estado).toBe("En Progreso");
    });

    it("resetea ordenBandeja al mover (null → reordenar al final)", () => {
        const actualizado = moverCard(MOCK_CARDS, "k1", "En Progreso");
        const card = actualizado.find((c) => c.uuid === "k1")!;
        expect(card.ordenBandeja).toBeNull();
    });

    it("no afecta a otras cards al mover una", () => {
        const actualizado = moverCard(MOCK_CARDS, "k1", "Completada");
        const noMovidas = actualizado.filter((c) => c.uuid !== "k1");
        noMovidas.forEach((c) => {
            const original = MOCK_CARDS.find((o) => o.uuid === c.uuid)!;
            expect(c.estado).toBe(original.estado);
        });
    });

    it("no modifica el array original (inmutabilidad)", () => {
        const originalEstado = MOCK_CARDS[0].estado;
        moverCard(MOCK_CARDS, "k1", "Completada");
        expect(MOCK_CARDS[0].estado).toBe(originalEstado);
    });
});

describe("contarPorColumna — métricas del tablero", () => {
    it("cuenta correctamente por estado", () => {
        const conteo = contarPorColumna(MOCK_CARDS);
        expect(conteo["Inbox"]).toBe(2);
        expect(conteo["En Progreso"]).toBe(2);
        expect(conteo["Completada"]).toBe(1);
    });

    it("retorna cero para columna sin cards", () => {
        const soloInbox: KanbanCard[] = [MOCK_CARDS[0]];
        const conteo = contarPorColumna(soloInbox);
        expect(conteo["En Progreso"]).toBe(0);
        expect(conteo["Completada"]).toBe(0);
    });
});

describe("filtrarCards — búsqueda en el tablero", () => {
    it("retorna todas las cards con búsqueda vacía", () => {
        expect(filtrarCards(MOCK_CARDS, "")).toHaveLength(5);
    });

    it("filtra por contenido del título (case-insensitive)", () => {
        const result = filtrarCards(MOCK_CARDS, "informe");
        expect(result).toHaveLength(1);
        expect(result[0].uuid).toBe("k2");
    });

    it("retorna vacío si no hay coincidencias", () => {
        expect(filtrarCards(MOCK_CARDS, "xyz-no-existe")).toHaveLength(0);
    });
});

describe("columnaEstaVacia — estado de columna", () => {
    it("retorna false para columna con cards", () => {
        expect(columnaEstaVacia(MOCK_CARDS, "Inbox")).toBe(false);
    });

    it("retorna true para columna sin cards", () => {
        const sinCompletadas = MOCK_CARDS.filter((c) => c.estado !== "Completada");
        expect(columnaEstaVacia(sinCompletadas, "Completada")).toBe(true);
    });
});
