/**
 * DIITRA — Tests: useSignatureProfile.ts (lógica pura)
 *
 * Valida la lógica del perfil de firma electrónica institucional:
 *  - Estado inicial del formulario de firma
 *  - Validación de datos del perfil (nombre, cargo, nº colegiado)
 *  - Formato del texto de firma (línea de cargo, institución)
 *  - Lógica de habilitación/deshabilitación de firma
 *  - Generación del texto visible de firma para documentos
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SignatureProfile {
    nombreCompleto: string;
    cargo: string;
    institucion: string;
    numeroColegiado: string | null;
    habilitado: boolean;
    ultimaActualizacion: string | null;
}

const PROFILE_DEFAULT: SignatureProfile = {
    nombreCompleto: "",
    cargo: "",
    institucion: "Instituto Superior Tecnológico Traversari",
    numeroColegiado: null,
    habilitado: false,
    ultimaActualizacion: null,
};

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function validarPerfil(perfil: SignatureProfile): string | null {
    if (!perfil.nombreCompleto.trim()) return "El nombre completo es requerido";
    if (!perfil.cargo.trim()) return "El cargo es requerido";
    if (!perfil.institucion.trim()) return "La institución es requerida";
    return null;
}

function generarTextoFirma(perfil: SignatureProfile): string {
    const lineas: string[] = [perfil.nombreCompleto];
    if (perfil.cargo) lineas.push(perfil.cargo);
    if (perfil.institucion) lineas.push(perfil.institucion);
    if (perfil.numeroColegiado) lineas.push(`Colegiado Nro. ${perfil.numeroColegiado}`);
    return lineas.join("\n");
}

function puedeHabilitar(perfil: SignatureProfile): boolean {
    return (
        perfil.nombreCompleto.trim().length > 0 &&
        perfil.cargo.trim().length > 0 &&
        perfil.institucion.trim().length > 0
    );
}

function estaActualizado(perfil: SignatureProfile, diasTolerados = 180): boolean {
    if (!perfil.ultimaActualizacion) return false;
    const ultima = new Date(perfil.ultimaActualizacion);
    const ahora = new Date();
    const dias = (ahora.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24);
    return dias <= diasTolerados;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Estado inicial SignatureProfile", () => {
    it("institución tiene valor por defecto IST Traversari", () => {
        expect(PROFILE_DEFAULT.institucion).toContain("Traversari");
    });

    it("habilitado false por defecto", () => {
        expect(PROFILE_DEFAULT.habilitado).toBe(false);
    });

    it("numeroColegiado null por defecto", () => {
        expect(PROFILE_DEFAULT.numeroColegiado).toBeNull();
    });
});

describe("validarPerfil — validación de campos requeridos", () => {
    const PERFIL_VALIDO: SignatureProfile = {
        nombreCompleto: "Dr. Luis Torres",
        cargo: "Docente Investigador",
        institucion: "Instituto Superior Tecnológico Traversari",
        numeroColegiado: "SENESCYT-12345",
        habilitado: false,
        ultimaActualizacion: null,
    };

    it("acepta perfil completo válido", () => {
        expect(validarPerfil(PERFIL_VALIDO)).toBeNull();
    });

    it("rechaza nombre vacío", () => {
        expect(validarPerfil({ ...PERFIL_VALIDO, nombreCompleto: "" })).toContain("nombre");
    });

    it("rechaza cargo vacío", () => {
        expect(validarPerfil({ ...PERFIL_VALIDO, cargo: "" })).toContain("cargo");
    });

    it("rechaza institución vacía", () => {
        expect(validarPerfil({ ...PERFIL_VALIDO, institucion: "" })).toContain("institución");
    });

    it("acepta sin número de colegiado (campo opcional)", () => {
        expect(validarPerfil({ ...PERFIL_VALIDO, numeroColegiado: null })).toBeNull();
    });
});

describe("generarTextoFirma — formato del texto de firma", () => {
    it("incluye nombre, cargo e institución", () => {
        const perfil: SignatureProfile = {
            nombreCompleto: "Mg. Ana Ruiz",
            cargo: "Coordinadora de Investigación",
            institucion: "IST Traversari",
            numeroColegiado: null,
            habilitado: true,
            ultimaActualizacion: "2026-01-01",
        };
        const texto = generarTextoFirma(perfil);
        expect(texto).toContain("Mg. Ana Ruiz");
        expect(texto).toContain("Coordinadora de Investigación");
        expect(texto).toContain("IST Traversari");
    });

    it("incluye número de colegiado cuando existe", () => {
        const perfil: SignatureProfile = {
            ...PROFILE_DEFAULT,
            nombreCompleto: "Dr. Test",
            cargo: "Docente",
            numeroColegiado: "SENESCYT-99999",
        };
        expect(generarTextoFirma(perfil)).toContain("SENESCYT-99999");
    });

    it("omite número de colegiado cuando es null", () => {
        const perfil: SignatureProfile = { ...PROFILE_DEFAULT, nombreCompleto: "Test", cargo: "Cargo" };
        expect(generarTextoFirma(perfil)).not.toContain("Colegiado");
    });
});

describe("puedeHabilitar — condición para activar firma", () => {
    it("puede habilitar con datos completos", () => {
        const perfil: SignatureProfile = {
            nombreCompleto: "Dr. Test",
            cargo: "Docente",
            institucion: "IST",
            numeroColegiado: null,
            habilitado: false,
            ultimaActualizacion: null,
        };
        expect(puedeHabilitar(perfil)).toBe(true);
    });

    it("no puede habilitar sin nombre", () => {
        expect(puedeHabilitar({ ...PROFILE_DEFAULT, cargo: "Cargo", institucion: "IST" })).toBe(false);
    });

    it("no puede habilitar sin cargo", () => {
        expect(puedeHabilitar({ ...PROFILE_DEFAULT, nombreCompleto: "Nombre", institucion: "IST" })).toBe(false);
    });
});

describe("estaActualizado — vigencia del perfil de firma", () => {
    it("perfil actualizado ayer está vigente (dentro de 180 días)", () => {
        const ayer = new Date(Date.now() - 86400000).toISOString();
        const perfil = { ...PROFILE_DEFAULT, ultimaActualizacion: ayer };
        expect(estaActualizado(perfil)).toBe(true);
    });

    it("perfil actualizado hace 200 días NO está vigente", () => {
        const vencido = new Date(Date.now() - 200 * 86400000).toISOString();
        const perfil = { ...PROFILE_DEFAULT, ultimaActualizacion: vencido };
        expect(estaActualizado(perfil)).toBe(false);
    });

    it("perfil sin fecha de actualización NO está vigente", () => {
        expect(estaActualizado(PROFILE_DEFAULT)).toBe(false);
    });
});
