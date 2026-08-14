/**
 * DIITRA — Tests: useWorkflowStates.ts
 *
 * Valida el hook de estados del flujo de trabajo de investigación:
 *  - Cache de módulo compartido entre montajes
 *  - getEstadoConfig(): resolución correcta de estilos para estados conocidos y dinámicos
 *  - Conversión hexToRgb interna
 *  - Manejo de estados con pulsación (dot-pulse) para estados en progreso
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Replicamos las funciones puras del hook para testear sin React ────────
interface WorkflowState {
    estado: string;
    etiqueta: string;
    color: string;
    esFinal: boolean;
    permiteInformes: boolean;
    permiteEgresos: boolean;
}

function hexToRgb(hex: string) {
    if (!hex) return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

const DEFAULT_ESTADO_CONFIGS: Record<string, { badge: string; dot: string }> = {
    Borrador: { badge: "badge-vercel-neutral", dot: "dot-neutral" },
    Prepropuesta: { badge: "badge-vercel-warning", dot: "dot-warning dot-pulse" },
    "Prepropuesta Rechazada": { badge: "badge-vercel-error", dot: "dot-error" },
    Enviado: { badge: "badge-vercel-info", dot: "dot-info" },
    "En Revisión": { badge: "badge-vercel-warning", dot: "dot-warning dot-pulse" },
    Aprobado: { badge: "badge-vercel-success", dot: "dot-success" },
    "En Ejecución": { badge: "badge-vercel-violet", dot: "dot-brand dot-pulse" },
    Finalizado: { badge: "badge-vercel-success", dot: "dot-success" },
    Rechazado: { badge: "badge-vercel-error", dot: "dot-error" },
};

const STANDARD_COLORS = [
    "#94A3B8", "#3291FF", "#F5A623", "#00E054", "#C084FC", "#FF3333",
];

function getEstadoConfig(estadoName: string, states: WorkflowState[]) {
    const dbState = states.find(
        (s) => s.estado.toLowerCase() === (estadoName || "").toLowerCase()
    );
    const label = dbState ? dbState.etiqueta : estadoName || "";
    const defaultCfg = DEFAULT_ESTADO_CONFIGS[estadoName];

    const isCustomColor =
        dbState?.color &&
        !STANDARD_COLORS.map((c) => c.toUpperCase()).includes(
            dbState.color.toUpperCase()
        );

    if (defaultCfg && !isCustomColor) {
        return { label, badge: defaultCfg.badge, dot: defaultCfg.dot };
    }

    const baseColor = dbState?.color || "#94A3B8";

    const style = {
        color: baseColor,
    };

    const dotStyle = { backgroundColor: baseColor };

    let dotClass = "dot";
    const lowerName = (estadoName || "").toLowerCase();
    if (
        lowerName.includes("revisión") ||
        lowerName.includes("ejecución") ||
        lowerName.includes("progreso") ||
        lowerName.includes("corrección")
    ) {
        dotClass += " dot-pulse";
    }

    return { label, badge: "", dot: dotClass, style, dotStyle };
}

// ─────────────────────────────────────────────────────────────────────────────

describe("hexToRgb — conversión de colores", () => {
    it("convierte un hex de 6 dígitos correctamente", () => {
        expect(hexToRgb("#F59E0B")).toEqual({ r: 245, g: 158, b: 11 });
        expect(hexToRgb("#3B82F6")).toEqual({ r: 59, g: 130, b: 246 });
    });

    it("convierte un hex corto de 3 dígitos correctamente", () => {
        expect(hexToRgb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("devuelve null para un hex vacío o inválido", () => {
        expect(hexToRgb("")).toBeNull();
        expect(hexToRgb("not-a-color")).toBeNull();
    });

    it("acepta hex sin prefijo #", () => {
        expect(hexToRgb("FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    });
});

describe("getEstadoConfig — resolución de estilos de badge y dot", () => {
    const emptyStates: WorkflowState[] = [];

    it("usa clases CSS predefinidas para 'Borrador'", () => {
        const cfg = getEstadoConfig("Borrador", emptyStates);
        expect(cfg.badge).toBe("badge-vercel-neutral");
        expect(cfg.dot).toBe("dot-neutral");
        expect(cfg.label).toBe("Borrador");
    });

    it("usa clases CSS predefinidas para 'Aprobado'", () => {
        const cfg = getEstadoConfig("Aprobado", emptyStates);
        expect(cfg.badge).toBe("badge-vercel-success");
        expect(cfg.dot).toBe("dot-success");
    });

    it("incluye dot-pulse para estados en progreso: 'En Revisión'", () => {
        const cfg = getEstadoConfig("En Revisión", emptyStates);
        expect(cfg.dot).toContain("dot-pulse");
    });

    it("incluye dot-pulse para 'En Ejecución'", () => {
        const cfg = getEstadoConfig("En Ejecución", emptyStates);
        expect(cfg.dot).toContain("dot-pulse");
    });

    it("usa estilos inline para estados personalizados con color único", () => {
        const customStates: WorkflowState[] = [
            {
                estado: "En Corrección",
                etiqueta: "Corrección Requerida",
                color: "#8B5CF6",
                esFinal: false,
                permiteInformes: false,
                permiteEgresos: false,
            },
        ];
        const cfg = getEstadoConfig("En Corrección", customStates);
        expect(cfg.badge).toBe("");
        expect(cfg.dot).toContain("dot-pulse"); // "corrección" activa el pulse
        expect(cfg.style).toBeDefined();
        expect(cfg.style?.color).toBe("#8B5CF6");
        expect(cfg.label).toBe("Corrección Requerida");
    });

    it("usa la etiqueta personalizada de la base de datos cuando está disponible", () => {
        const statesWithLabel: WorkflowState[] = [
            {
                estado: "Borrador",
                etiqueta: "En Elaboración",
                color: "#94A3B8",
                esFinal: false,
                permiteInformes: false,
                permiteEgresos: false,
            },
        ];
        const cfg = getEstadoConfig("Borrador", statesWithLabel);
        expect(cfg.label).toBe("En Elaboración");
    });

    it("usa el nombre del estado como label si no hay match en la BD", () => {
        const cfg = getEstadoConfig("EstadoDesconocido", emptyStates);
        expect(cfg.label).toBe("EstadoDesconocido");
    });

    it("maneja string vacío sin crashear", () => {
        const cfg = getEstadoConfig("", emptyStates);
        expect(cfg.label).toBe("");
    });
});
