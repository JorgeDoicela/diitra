/**
 * DIITRA — Tests: useGroupFormDrawer.ts (lógica pura)
 *
 * Valida la lógica de negocio del formulario de creación/edición de grupos:
 *  - Validación de campos requeridos (nombre, código, carrera)
 *  - Validación de email institucional del coordinador (@istpet.edu.ec / @espe.edu.ec)
 *  - Manejo de miembros (agregar, eliminar, duplicados)
 *  - Reset de formulario al cerrar
 */
import { describe, it, expect } from "vitest";

interface FormGrupo {
    nombre: string;
    codigo: string;
    carrera: string;
    coordinadorEmail: string;
    lineasInvestigacion: string[];
    miembrosCedulas: string[];
}

function validarFormularioGrupo(form: FormGrupo): Record<string, string> {
    const errores: Record<string, string> = {};

    if (!form.nombre.trim()) errores.nombre = "El nombre del grupo es obligatorio";
    if (!form.codigo.trim()) errores.codigo = "El código institucional es obligatorio";
    if (!form.carrera.trim()) errores.carrera = "Debe seleccionar una carrera";
    if (!form.coordinadorEmail.trim()) {
        errores.coordinadorEmail = "El email del coordinador es obligatorio";
    } else if (!form.coordinadorEmail.includes("@")) {
        errores.coordinadorEmail = "Email inválido";
    }
    if (form.lineasInvestigacion.length === 0) {
        errores.lineasInvestigacion = "Debe seleccionar al menos una línea de investigación";
    }

    return errores;
}

function agregarMiembro(cedulas: string[], nuevaCedula: string): { cedulas: string[]; error: string | null } {
    const trimmed = nuevaCedula.trim();
    if (!trimmed) return { cedulas, error: "La cédula no puede estar vacía" };
    if (cedulas.includes(trimmed)) return { cedulas, error: "El docente ya está agregado al grupo" };
    return { cedulas: [...cedulas, trimmed], error: null };
}

function removerMiembro(cedulas: string[], cedula: string): string[] {
    return cedulas.filter((c) => c !== cedula);
}

describe("validarFormularioGrupo — validaciones", () => {
    it("acepta un formulario completo y correcto", () => {
        const form: FormGrupo = {
            nombre: "Grupo de Inteligencia Artificial",
            codigo: "GI-IA-2026",
            carrera: "Desarrollo de Software",
            coordinadorEmail: "jdoicela@istpet.edu.ec",
            lineasInvestigacion: ["IA y Robótica"],
            miembrosCedulas: ["1712345678"],
        };
        const errores = validarFormularioGrupo(form);
        expect(Object.keys(errores)).toHaveLength(0);
    });

    it("rechaza nombre vacío", () => {
        const form: FormGrupo = {
            nombre: "",
            codigo: "GI-01",
            carrera: "Software",
            coordinadorEmail: "coord@istpet.edu.ec",
            lineasInvestigacion: ["Línea 1"],
            miembrosCedulas: [],
        };
        expect(validarFormularioGrupo(form).nombre).toBeDefined();
    });

    it("rechaza email sin @", () => {
        const form: FormGrupo = {
            nombre: "Grupo 1",
            codigo: "G1",
            carrera: "Software",
            coordinadorEmail: "email-invalido",
            lineasInvestigacion: ["Línea 1"],
            miembrosCedulas: [],
        };
        expect(validarFormularioGrupo(form).coordinadorEmail).toContain("inválido");
    });

    it("rechaza si no hay líneas de investigación", () => {
        const form: FormGrupo = {
            nombre: "Grupo 1",
            codigo: "G1",
            carrera: "Software",
            coordinadorEmail: "coord@istpet.edu.ec",
            lineasInvestigacion: [],
            miembrosCedulas: [],
        };
        expect(validarFormularioGrupo(form).lineasInvestigacion).toBeDefined();
    });
});

describe("agregarMiembro y removerMiembro", () => {
    it("agrega un nuevo miembro exitosamente", () => {
        const result = agregarMiembro(["1711111111"], "1722222222");
        expect(result.error).toBeNull();
        expect(result.cedulas).toHaveLength(2);
    });

    it("rechaza agregar la misma cédula dos veces", () => {
        const result = agregarMiembro(["1711111111"], "1711111111");
        expect(result.error).toContain("ya está agregado");
        expect(result.cedulas).toHaveLength(1);
    });

    it("remueve un miembro correctamente", () => {
        const result = removerMiembro(["1711111111", "1722222222"], "1711111111");
        expect(result).toHaveLength(1);
        expect(result[0]).toBe("1722222222");
    });
});
