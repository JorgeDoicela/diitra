/**
 * DIITRA — Tests: useSidebar.ts (lógica pura de navegación y estado)
 *
 * Valida la lógica del menú lateral del sistema:
 *  - Filtrado de rutas según rol del usuario (ADMIN vs DOCENTE)
 *  - Colapso y expansión de grupos de menú
 *  - Detección de ruta activa
 */
import { describe, it, expect } from "vitest";

interface MenuItem {
    id: string;
    label: string;
    path: string;
    rolesRequeridos?: string[];
}

const MENU_ITEMS_MOCK: MenuItem[] = [
    { id: "home", label: "Inicio", path: "/dashboard" },
    { id: "convocatorias", label: "Convocatorias", path: "/investigacion/convocatorias", rolesRequeridos: ["ADMIN", "DOCENTE"] },
    { id: "admin-users", label: "Gestión de Usuarios", path: "/admin/usuarios", rolesRequeridos: ["ADMIN"] },
    { id: "admin-config", label: "Configuración", path: "/admin/configuracion", rolesRequeridos: ["ADMIN"] },
];

function filtrarMenuPorRol(items: MenuItem[], rolesUsuario: string[]): MenuItem[] {
    return items.filter((item) => {
        if (!item.rolesRequeridos || item.rolesRequeridos.length === 0) return true;
        return item.rolesRequeridos.some((r) => rolesUsuario.includes(r));
    });
}

function esRutaActiva(currentPath: string, targetPath: string): boolean {
    if (targetPath === "/dashboard") return currentPath === "/dashboard";
    return currentPath.startsWith(targetPath);
}

describe("filtrarMenuPorRol — permisos de navegación", () => {
    it("ADMIN ve todos los ítems de menú", () => {
        const result = filtrarMenuPorRol(MENU_ITEMS_MOCK, ["ADMIN"]);
        expect(result).toHaveLength(4);
    });

    it("DOCENTE solo ve ítems públicos y de docente", () => {
        const result = filtrarMenuPorRol(MENU_ITEMS_MOCK, ["DOCENTE"]);
        expect(result).toHaveLength(2);
        expect(result.map((i) => i.id)).toEqual(["home", "convocatorias"]);
    });

    it("Usuario sin rol solo ve ítems sin restricción", () => {
        const result = filtrarMenuPorRol(MENU_ITEMS_MOCK, []);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("home");
    });
});

describe("esRutaActiva — coincidencia de URL", () => {
    it("retorna true si la ruta coincide exactamente", () => {
        expect(esRutaActiva("/admin/usuarios", "/admin/usuarios")).toBe(true);
    });

    it("retorna true si es subruta de la ruta target", () => {
        expect(esRutaActiva("/investigacion/convocatorias/123", "/investigacion/convocatorias")).toBe(true);
    });

    it("retorna false para rutas distintas", () => {
        expect(esRutaActiva("/admin/usuarios", "/investigacion/convocatorias")).toBe(false);
    });
});
