/**
 * DIITRA — Tests: useICalSync.ts (Sincronización iCal)
 *
 * Valida la lógica de generación y formateo de URLs de suscripción iCal:
 *  - Formato del enlace webcal:// vs https://
 *  - Validación del token de suscripción
 */
import { describe, it, expect } from "vitest";

function generarUrlWebcal(baseUrl: string, token: string): string {
    if (!token.trim()) return "";
    const cleanBase = baseUrl.replace(/^https?:\/\//, "");
    return `webcal://${cleanBase}/api/v1/calendario/feed.ics?token=${token}`;
}

function validarTokenIcal(token: string): boolean {
    return token.length >= 16 && !/\s/.test(token);
}

describe("useICalSync — suscripción iCal", () => {
    it("genera la URL con protocolo webcal://", () => {
        const url = generarUrlWebcal("https://diitra.istpet.edu.ec", "token1234567890abc");
        expect(url).toContain("webcal://diitra.istpet.edu.ec/api/v1/calendario/feed.ics?token=token1234567890abc");
    });

    it("valida tokens de sincronización seguros", () => {
        expect(validarTokenIcal("abc123def456ghi789")).toBe(true);
        expect(validarTokenIcal("corto")).toBe(false);
        expect(validarTokenIcal("token con espacios 123")).toBe(false);
    });
});
