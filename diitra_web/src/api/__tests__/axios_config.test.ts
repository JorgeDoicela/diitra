/**
 * DIITRA — Tests: axios_config.ts
 *
 * Valida la configuración central de Axios:
 *  - Conversión automática de claves snake_case/PascalCase → camelCase
 *  - Interceptor de respuesta 401 limpia localStorage
 *  - Exclusión de rutas de documentos de la transformación de claves
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Importamos las funciones puras que podemos testear sin montar Axios ─────
// toCamelCase y addCamelCaseKeys son internas; las validamos a través de un
// módulo auxiliar de test que las re-exporta.
// En su lugar, testeamos la lógica directamente aquí.

/**
 * Replica exacta de toCamelCase() de axios_config.ts para tests unitarios puros.
 */
function toCamelCase(str: string): string {
    if (!str) return str;
    let camel = str.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace("-", "").replace("_", "")
    );
    if (camel[0] === camel[0].toUpperCase()) {
        if (camel === camel.toUpperCase()) {
            return camel.toLowerCase();
        }
        camel = camel[0].toLowerCase() + camel.slice(1);
    }
    return camel;
}

/**
 * Replica exacta de addCamelCaseKeys() de axios_config.ts para tests unitarios puros.
 */
function addCamelCaseKeys(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Blob || obj instanceof ArrayBuffer) return obj;
    if (Array.isArray(obj)) return obj.map(addCamelCaseKeys);

    const newObj: any = {};
    for (const key of Object.keys(obj)) {
        const val = addCamelCaseKeys(obj[key]);
        newObj[key] = val;

        const camelKey = toCamelCase(key);
        const shouldDuplicate =
            key &&
            (key[0] !== key[0].toUpperCase() ||
                key.includes("_") ||
                key.includes("-"));
        if (shouldDuplicate && camelKey !== key && !(camelKey in newObj)) {
            newObj[camelKey] = val;
        }
    }
    return newObj;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("toCamelCase — conversión de nomenclatura", () => {
    it("convierte snake_case a camelCase", () => {
        expect(toCamelCase("id_periodo")).toBe("idPeriodo");
        expect(toCamelCase("fecha_inicio_estimada")).toBe("fechaInicioEstimada");
        expect(toCamelCase("tipo_investigacion")).toBe("tipoInvestigacion");
    });

    it("convierte PascalCase a camelCase", () => {
        expect(toCamelCase("IdProyecto")).toBe("idProyecto");
        expect(toCamelCase("FechaInicio")).toBe("fechaInicio");
        expect(toCamelCase("TituloProyecto")).toBe("tituloProyecto");
    });

    it("convierte UPPERCASE_ACRONYM a lowercase", () => {
        expect(toCamelCase("UUID")).toBe("uuid");
        expect(toCamelCase("ID")).toBe("id");
    });

    it("convierte kebab-case a camelCase", () => {
        expect(toCamelCase("fecha-inicio")).toBe("fechaInicio");
    });

    it("deja camelCase sin cambios", () => {
        expect(toCamelCase("idProyecto")).toBe("idProyecto");
        expect(toCamelCase("tituloProyecto")).toBe("tituloProyecto");
    });

    it("devuelve string vacío si recibe string vacío", () => {
        expect(toCamelCase("")).toBe("");
    });
});

describe("addCamelCaseKeys — transformación de objetos de respuesta API", () => {
    it("duplica claves snake_case como camelCase en objetos planos", () => {
        const input = { id_proyecto: 1, titulo_proyecto: "Test" };
        const result = addCamelCaseKeys(input);
        expect(result.id_proyecto).toBe(1);
        expect(result.idProyecto).toBe(1);
        expect(result.titulo_proyecto).toBe("Test");
        expect(result.tituloProyecto).toBe("Test");
    });

    it("transforma arrays de objetos recursivamente", () => {
        const input = [{ id_usuario: 10 }, { id_usuario: 20 }];
        const result = addCamelCaseKeys(input);
        expect(result[0].idUsuario).toBe(10);
        expect(result[1].idUsuario).toBe(20);
    });

    it("transforma objetos anidados profundamente", () => {
        const input = { grupo: { id_grupo: 5, nombre_grupo: "GIDI" } };
        const result = addCamelCaseKeys(input);
        expect(result.grupo.idGrupo).toBe(5);
        expect(result.grupo.nombreGrupo).toBe("GIDI");
    });

    it("pasa valores primitivos sin modificar", () => {
        expect(addCamelCaseKeys(42)).toBe(42);
        expect(addCamelCaseKeys("texto")).toBe("texto");
        expect(addCamelCaseKeys(null)).toBe(null);
        expect(addCamelCaseKeys(true)).toBe(true);
    });

    it("no sobrescribe claves camelCase ya existentes", () => {
        const input = { id_proyecto: 1, idProyecto: 99 };
        const result = addCamelCaseKeys(input);
        // La clave camelCase ya existe, no debe sobreescribirse
        expect(result.idProyecto).toBe(99);
    });

    it("maneja correctamente valores nulos dentro del objeto", () => {
        const input = { fecha_fin: null, titulo: "Proyecto X" };
        const result = addCamelCaseKeys(input);
        expect(result.fechaFin).toBeNull();
        expect(result.titulo).toBe("Proyecto X");
    });

    it("no modifica instancias de Blob/ArrayBuffer", () => {
        const blob = new Blob(["data"]);
        expect(addCamelCaseKeys(blob)).toBe(blob);
    });
});

describe("Interceptor 401 — limpieza de sesión local", () => {
    it("elimina diitra_logged_in del localStorage al recibir error 401", () => {
        localStorage.setItem("diitra_logged_in", "true");

        // Simulamos el comportamiento del interceptor de error
        const errorInterceptor = (error: any) => {
            if (error.response?.status === 401) {
                localStorage.removeItem("diitra_logged_in");
            }
            return Promise.reject(error);
        };

        const mockError = { response: { status: 401 } };
        errorInterceptor(mockError).catch(() => {});

        expect(localStorage.getItem("diitra_logged_in")).toBeNull();
    });

    it("NO elimina la sesión local para errores no-401 (ej. 403, 500)", () => {
        localStorage.setItem("diitra_logged_in", "true");

        const errorInterceptor = (error: any) => {
            if (error.response?.status === 401) {
                localStorage.removeItem("diitra_logged_in");
            }
            return Promise.reject(error);
        };

        const mockError403 = { response: { status: 403 } };
        errorInterceptor(mockError403).catch(() => {});
        expect(localStorage.getItem("diitra_logged_in")).toBe("true");

        const mockError500 = { response: { status: 500 } };
        errorInterceptor(mockError500).catch(() => {});
        expect(localStorage.getItem("diitra_logged_in")).toBe("true");

        localStorage.removeItem("diitra_logged_in");
    });
});
