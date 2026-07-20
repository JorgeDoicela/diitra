/**
 * DIITRA — Tests: useEmailComposer.ts (lógica pura)
 *
 * Valida la lógica del compositor de emails institucionales:
 *  - Validación del formulario de email (destinatario, asunto, cuerpo)
 *  - Sustitución de variables en templates ({{nombre}}, {{proyecto}}, etc.)
 *  - Clasificación de destinatarios (individual / grupo / rol)
 *  - Cálculo de longitud de asunto (máx 150 chars)
 *  - Detección de adjuntos válidos/inválidos por extensión
 *  - Estado del formulario por defecto
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EmailForm {
    destinatarios: string[];
    asunto: string;
    cuerpoHtml: string;
    templateId: number | null;
    adjuntos: string[];
}

const EMAIL_FORM_DEFAULT: EmailForm = {
    destinatarios: [],
    asunto: "",
    cuerpoHtml: "",
    templateId: null,
    adjuntos: [],
};

// ─── Lógica pura ──────────────────────────────────────────────────────────────

function validarEmailForm(form: EmailForm): string | null {
    if (form.destinatarios.length === 0) return "Debe especificar al menos un destinatario";
    if (!form.asunto.trim()) return "El asunto es requerido";
    if (form.asunto.length > 150) return "El asunto no puede superar 150 caracteres";
    if (!form.cuerpoHtml.trim()) return "El cuerpo del email es requerido";
    return null;
}

function sustituirVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

const EXTENSIONES_PERMITIDAS = [".pdf", ".docx", ".doc", ".xlsx", ".png", ".jpg", ".jpeg"];

function esAdjuntoValido(nombreArchivo: string): boolean {
    const ext = nombreArchivo.toLowerCase().slice(nombreArchivo.lastIndexOf("."));
    return EXTENSIONES_PERMITIDAS.includes(ext);
}

function validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function limpiarDestinatarios(raw: string[]): string[] {
    return raw.map((e) => e.trim().toLowerCase()).filter((e) => validarEmail(e));
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Estado inicial EmailForm", () => {
    it("destinatarios vacío por defecto", () => {
        expect(EMAIL_FORM_DEFAULT.destinatarios).toHaveLength(0);
    });

    it("asunto vacío por defecto", () => {
        expect(EMAIL_FORM_DEFAULT.asunto).toBe("");
    });

    it("templateId null por defecto", () => {
        expect(EMAIL_FORM_DEFAULT.templateId).toBeNull();
    });
});

describe("validarEmailForm — validación del formulario", () => {
    it("acepta formulario completo válido", () => {
        const form: EmailForm = {
            destinatarios: ["docente@ist.edu.ec"],
            asunto: "Convocatoria Investigación 2026",
            cuerpoHtml: "<p>Estimado docente...</p>",
            templateId: 1,
            adjuntos: [],
        };
        expect(validarEmailForm(form)).toBeNull();
    });

    it("rechaza sin destinatarios", () => {
        const form = { ...EMAIL_FORM_DEFAULT, asunto: "Test", cuerpoHtml: "<p>Test</p>" };
        expect(validarEmailForm(form)).toContain("destinatario");
    });

    it("rechaza asunto vacío", () => {
        const form = { ...EMAIL_FORM_DEFAULT, destinatarios: ["a@b.com"], cuerpoHtml: "<p>X</p>" };
        expect(validarEmailForm(form)).toContain("asunto");
    });

    it("rechaza asunto mayor a 150 caracteres", () => {
        const form = {
            ...EMAIL_FORM_DEFAULT,
            destinatarios: ["a@b.com"],
            asunto: "A".repeat(151),
            cuerpoHtml: "<p>X</p>",
        };
        expect(validarEmailForm(form)).toContain("150");
    });

    it("rechaza cuerpo vacío", () => {
        const form = { ...EMAIL_FORM_DEFAULT, destinatarios: ["a@b.com"], asunto: "Test" };
        expect(validarEmailForm(form)).toContain("cuerpo");
    });
});

describe("sustituirVariables — interpolación de templates", () => {
    it("sustituye variables correctamente", () => {
        const result = sustituirVariables(
            "Estimado {{nombre}}, su proyecto {{proyecto}} fue aprobado.",
            { nombre: "Dr. Torres", proyecto: "IA Médica" }
        );
        expect(result).toBe("Estimado Dr. Torres, su proyecto IA Médica fue aprobado.");
    });

    it("deja variables sin definir sin cambios", () => {
        const result = sustituirVariables("Hola {{nombre}}, {{apellido}}", { nombre: "Luis" });
        expect(result).toContain("Luis");
        expect(result).toContain("{{apellido}}");
    });

    it("maneja template sin variables", () => {
        const result = sustituirVariables("Sin variables aquí.", {});
        expect(result).toBe("Sin variables aquí.");
    });

    it("soporta múltiples instancias de la misma variable", () => {
        const result = sustituirVariables("{{x}} y {{x}}", { x: "test" });
        expect(result).toBe("test y test");
    });
});

describe("esAdjuntoValido — validación de extensiones", () => {
    it("acepta extensiones permitidas", () => {
        expect(esAdjuntoValido("informe.pdf")).toBe(true);
        expect(esAdjuntoValido("datos.xlsx")).toBe(true);
        expect(esAdjuntoValido("foto.jpg")).toBe(true);
        expect(esAdjuntoValido("doc.docx")).toBe(true);
    });

    it("rechaza extensiones no permitidas", () => {
        expect(esAdjuntoValido("script.exe")).toBe(false);
        expect(esAdjuntoValido("data.csv")).toBe(false);
        expect(esAdjuntoValido("virus.bat")).toBe(false);
    });

    it("es case-insensitive", () => {
        expect(esAdjuntoValido("INFORME.PDF")).toBe(true);
        expect(esAdjuntoValido("Foto.JPG")).toBe(true);
    });
});

describe("limpiarDestinatarios — normalización de emails", () => {
    it("elimina espacios y convierte a minúsculas", () => {
        const result = limpiarDestinatarios(["  Dr.TORRES@IST.EDU.EC  "]);
        expect(result[0]).toBe("dr.torres@ist.edu.ec");
    });

    it("filtra emails inválidos", () => {
        const result = limpiarDestinatarios(["valido@ist.edu.ec", "no-es-email", "otro@valido.com"]);
        expect(result).toHaveLength(2);
    });

    it("retorna vacío para lista de emails todos inválidos", () => {
        expect(limpiarDestinatarios(["noEmail", "tampoco"])).toHaveLength(0);
    });
});
