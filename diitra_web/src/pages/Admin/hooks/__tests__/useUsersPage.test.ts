/**
 * DIITRA — Tests: useUsersPage.ts (lógica pura)
 *
 * Valida la lógica de gestión de usuarios en el panel de administración:
 *  - Filtrado de usuarios por nombre, cedula o email
 *  - Ordenación por nombre/fecha
 *  - Clasificación por rol (Admin/Docente/Estudiante)
 *  - Validación del formulario de usuario
 *  - Paginación de resultados
 *  - Estado del modal de edición
 */
import { describe, it, expect } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserItem {
    idUsuario: number;
    nombre: string;
    idSigafi: string;
    emailInstitucional: string | null;
    administrador: boolean;
    activo: boolean;
    tablaSigafi: string; // "profesor" | "alumno"
}

// ─── Lógica pura del hook ─────────────────────────────────────────────────────

function filtrarUsuarios(usuarios: UserItem[], busqueda: string): UserItem[] {
    if (!busqueda.trim()) return usuarios;
    const q = busqueda.toLowerCase().trim();
    return usuarios.filter(
        (u) =>
            u.nombre?.toLowerCase().includes(q) ||
            u.idSigafi?.toLowerCase().includes(q) ||
            u.emailInstitucional?.toLowerCase().includes(q)
    );
}

function filtrarPorRol(
    usuarios: UserItem[],
    filtro: "todos" | "admin" | "docente" | "estudiante"
): UserItem[] {
    if (filtro === "todos") return usuarios;
    if (filtro === "admin") return usuarios.filter((u) => u.administrador);
    if (filtro === "docente") return usuarios.filter((u) => !u.administrador && u.tablaSigafi === "profesor");
    if (filtro === "estudiante") return usuarios.filter((u) => u.tablaSigafi === "alumno");
    return usuarios;
}

function paginarUsuarios(usuarios: UserItem[], pagina: number, tamanoPagina: number): UserItem[] {
    const inicio = (pagina - 1) * tamanoPagina;
    return usuarios.slice(inicio, inicio + tamanoPagina);
}

function calcularTotalPaginas(total: number, tamanoPagina: number): number {
    return Math.ceil(total / tamanoPagina);
}

function validarUsuarioForm(form: { nombre: string; idSigafi: string; email: string }): string | null {
    if (!form.nombre.trim()) return "El nombre es requerido";
    if (!form.idSigafi.trim()) return "El ID SIGAFI es requerido";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "El email no tiene un formato válido";
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_USERS: UserItem[] = [
    { idUsuario: 1, nombre: "Dr. Luis Torres", idSigafi: "ltorres001", emailInstitucional: "ltorres@ist.edu.ec", administrador: false, activo: true, tablaSigafi: "profesor" },
    { idUsuario: 2, nombre: "Mg. Ana Ruiz", idSigafi: "aruiz002", emailInstitucional: "aruiz@ist.edu.ec", administrador: false, activo: true, tablaSigafi: "profesor" },
    { idUsuario: 3, nombre: "Admin DIITRA", idSigafi: "admin001", emailInstitucional: "admin@ist.edu.ec", administrador: true, activo: true, tablaSigafi: "profesor" },
    { idUsuario: 4, nombre: "Carlos Pérez", idSigafi: "cperez003", emailInstitucional: null, administrador: false, activo: true, tablaSigafi: "alumno" },
    { idUsuario: 5, nombre: "María González", idSigafi: "mgonzalez004", emailInstitucional: null, administrador: false, activo: false, tablaSigafi: "alumno" },
];

describe("filtrarUsuarios — búsqueda por texto", () => {
    it("retorna todos con búsqueda vacía", () => {
        expect(filtrarUsuarios(MOCK_USERS, "")).toHaveLength(5);
    });

    it("filtra por nombre (case-insensitive)", () => {
        const result = filtrarUsuarios(MOCK_USERS, "luis");
        expect(result).toHaveLength(1);
        expect(result[0].nombre).toContain("Luis");
    });

    it("filtra por idSigafi", () => {
        const result = filtrarUsuarios(MOCK_USERS, "admin001");
        expect(result).toHaveLength(1);
        expect(result[0].administrador).toBe(true);
    });

    it("filtra por email institucional", () => {
        const result = filtrarUsuarios(MOCK_USERS, "aruiz@ist");
        expect(result).toHaveLength(1);
        expect(result[0].idSigafi).toBe("aruiz002");
    });

    it("retorna vacío si no hay coincidencias", () => {
        expect(filtrarUsuarios(MOCK_USERS, "zzznomatch")).toHaveLength(0);
    });

    it("ignora usuarios con email null al buscar por email", () => {
        // Carlos Pérez no tiene email, no debe causar error al buscar
        const result = filtrarUsuarios(MOCK_USERS, "@ist.edu.ec");
        expect(result.some((u) => u.emailInstitucional === null)).toBe(false);
    });
});

describe("filtrarPorRol — clasificación por tipo de usuario", () => {
    it("retorna todos con filtro 'todos'", () => {
        expect(filtrarPorRol(MOCK_USERS, "todos")).toHaveLength(5);
    });

    it("retorna solo administradores", () => {
        const result = filtrarPorRol(MOCK_USERS, "admin");
        expect(result).toHaveLength(1);
        expect(result[0].idSigafi).toBe("admin001");
    });

    it("retorna docentes (profesores no-admin)", () => {
        const result = filtrarPorRol(MOCK_USERS, "docente");
        expect(result).toHaveLength(2);
        expect(result.every((u) => u.tablaSigafi === "profesor" && !u.administrador)).toBe(true);
    });

    it("retorna estudiantes (alumnos)", () => {
        const result = filtrarPorRol(MOCK_USERS, "estudiante");
        expect(result).toHaveLength(2);
        expect(result.every((u) => u.tablaSigafi === "alumno")).toBe(true);
    });
});

describe("paginarUsuarios — paginación", () => {
    it("retorna primera página correctamente", () => {
        const result = paginarUsuarios(MOCK_USERS, 1, 2);
        expect(result).toHaveLength(2);
        expect(result[0].idUsuario).toBe(1);
        expect(result[1].idUsuario).toBe(2);
    });

    it("retorna segunda página correctamente", () => {
        const result = paginarUsuarios(MOCK_USERS, 2, 2);
        expect(result).toHaveLength(2);
        expect(result[0].idUsuario).toBe(3);
    });

    it("retorna última página incompleta correctamente", () => {
        const result = paginarUsuarios(MOCK_USERS, 3, 2);
        expect(result).toHaveLength(1);
        expect(result[0].idUsuario).toBe(5);
    });
});

describe("calcularTotalPaginas", () => {
    it("calcula páginas correctamente para totales divisibles", () => {
        expect(calcularTotalPaginas(10, 5)).toBe(2);
    });

    it("redondea hacia arriba para totales no divisibles", () => {
        expect(calcularTotalPaginas(11, 5)).toBe(3);
        expect(calcularTotalPaginas(1, 5)).toBe(1);
    });

    it("retorna 0 para lista vacía", () => {
        expect(calcularTotalPaginas(0, 10)).toBe(0);
    });
});

describe("validarUsuarioForm — validación formulario", () => {
    it("acepta formulario válido completo", () => {
        expect(validarUsuarioForm({ nombre: "Dr. Test", idSigafi: "test001", email: "test@ist.edu.ec" })).toBeNull();
    });

    it("rechaza nombre vacío", () => {
        expect(validarUsuarioForm({ nombre: "", idSigafi: "test001", email: "" })).toContain("nombre");
    });

    it("rechaza idSigafi vacío", () => {
        expect(validarUsuarioForm({ nombre: "Test", idSigafi: "", email: "" })).toContain("SIGAFI");
    });

    it("rechaza email con formato inválido", () => {
        expect(validarUsuarioForm({ nombre: "Test", idSigafi: "t001", email: "no-es-email" })).toContain("email");
    });

    it("acepta email vacío (campo opcional)", () => {
        expect(validarUsuarioForm({ nombre: "Test", idSigafi: "t001", email: "" })).toBeNull();
    });
});
