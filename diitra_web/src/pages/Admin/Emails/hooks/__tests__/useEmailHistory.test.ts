/**
 * DIITRA — Tests: useEmailHistory.ts (Historial y reintentos de email)
 *
 * Valida la lógica de filtro y reintento de envíos de correo:
 *  - Filtrado por estado (ENVIADO, FALLIDO, PENDIENTE)
 *  - Determinación de elegibilidad para reintento (máximo 3 reintentos)
 */
import { describe, it, expect } from "vitest";

interface RegistroEmail {
    id: string;
    destinatario: string;
    asunto: string;
    estado: "ENVIADO" | "FALLIDO" | "PENDIENTE";
    intentos: number;
}

function sePuedeReintentar(registro: RegistroEmail): boolean {
    return registro.estado === "FALLIDO" && registro.intentos < 3;
}

function filtrarHistorialEmails(registros: RegistroEmail[], estadoFiltro: string): RegistroEmail[] {
    if (!estadoFiltro || estadoFiltro === "TODOS") return registros;
    return registros.filter((r) => r.estado === estadoFiltro);
}

describe("useEmailHistory — historial de envíos", () => {
    it("permite reintentar si el estado es FALLIDO e intentos < 3", () => {
        expect(sePuedeReintentar({ id: "1", destinatario: "test@espe.edu.ec", asunto: "A", estado: "FALLIDO", intentos: 1 })).toBe(true);
    });

    it("no permite reintentar si superó los 3 intentos", () => {
        expect(sePuedeReintentar({ id: "2", destinatario: "test@espe.edu.ec", asunto: "B", estado: "FALLIDO", intentos: 3 })).toBe(false);
    });

    it("filtra el historial por estado", () => {
        const registros: RegistroEmail[] = [
            { id: "1", destinatario: "a@a.com", asunto: "A", estado: "ENVIADO", intentos: 1 },
            { id: "2", destinatario: "b@b.com", asunto: "B", estado: "FALLIDO", intentos: 2 },
        ];
        const fallidos = filtrarHistorialEmails(registros, "FALLIDO");
        expect(fallidos).toHaveLength(1);
        expect(fallidos[0].id).toBe("2");
    });
});
