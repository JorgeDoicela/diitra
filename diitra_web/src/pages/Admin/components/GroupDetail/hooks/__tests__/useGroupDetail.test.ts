/**
 * DIITRA — Tests: useGroupDetail.ts (lógica pura)
 *
 * Valida la lógica del hook de detalle/edición de grupos de investigación:
 *  - Validación de campos del formulario de edición de grupo
 *  - Estado inicial del draft de edición
 *  - Detección de cambios respecto al original (isDirty)
 *  - Búsqueda de investigadores para agregar al grupo
 *  - Validación de capacidad máxima de miembros
 *  - Clasificación de miembros por rol (Coordinador/Investigador/Estudiante)
 */
import { describe, it, expect } from "vitest";

interface GrupoDetalle {
    idGrupo: number;
    nombreGrupo: string;
    codigoGrupo: string;
    descripcion: string | null;
    mision: string | null;
    vision: string | null;
    lineaInvestigacion: string | null;
    activo: boolean;
    fechaConstitucion: string | null;
    coordinadorNombre: string | null;
}

interface MiembroGrupo {
    idUsuario: number;
    nombre: string;
    cedula: string;
    cargo: string;
    activo: boolean;
    fechaIngreso: string | null;
}

const GRUPO_DRAFT_DEFAULT = {
    nombreGrupo: "",
    codigoGrupo: "",
    descripcion: "",
    mision: "",
    vision: "",
    lineaInvestigacion: "",
    fechaConstitucion: "",
};

function validarEditGrupo(draft: typeof GRUPO_DRAFT_DEFAULT): string | null {
    if (!draft.nombreGrupo.trim()) return "El nombre del grupo es requerido";
    if (!draft.codigoGrupo.trim()) return "El código del grupo es requerido";
    if (draft.codigoGrupo.length < 2) return "El código debe tener al menos 2 caracteres";
    if (draft.codigoGrupo.length > 20) return "El código no puede superar 20 caracteres";
    return null;
}

function hayCambios(original: GrupoDetalle, draft: typeof GRUPO_DRAFT_DEFAULT): boolean {
    return (
        original.nombreGrupo !== draft.nombreGrupo ||
        original.codigoGrupo !== draft.codigoGrupo ||
        (original.descripcion ?? "") !== draft.descripcion ||
        (original.mision ?? "") !== draft.mision ||
        (original.vision ?? "") !== draft.vision
    );
}

function buscarInvestigador(miembros: MiembroGrupo[], query: string): MiembroGrupo[] {
    if (!query.trim()) return miembros;
    const q = query.toLowerCase();
    return miembros.filter(
        (m) => m.nombre.toLowerCase().includes(q) || m.cedula.includes(q)
    );
}

function clasificarPorCargo(miembros: MiembroGrupo[]): Record<string, MiembroGrupo[]> {
    return miembros.reduce((acc, m) => {
        if (!acc[m.cargo]) acc[m.cargo] = [];
        acc[m.cargo].push(m);
        return acc;
    }, {} as Record<string, MiembroGrupo[]>);
}

const MAX_MIEMBROS = 20;
function excapeCapacidad(miembros: MiembroGrupo[]): boolean {
    return miembros.filter((m) => m.activo).length >= MAX_MIEMBROS;
}

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_MIEMBROS: MiembroGrupo[] = [
    { idUsuario: 1, nombre: "Dr. Torres (Coordinador)", cedula: "1712345678", cargo: "Coordinador", activo: true, fechaIngreso: "2020-01-01" },
    { idUsuario: 2, nombre: "Mg. Ruiz", cedula: "1798765432", cargo: "Investigador", activo: true, fechaIngreso: "2020-06-01" },
    { idUsuario: 3, nombre: "Ing. López", cedula: "1756789012", cargo: "Investigador", activo: true, fechaIngreso: "2021-01-01" },
    { idUsuario: 4, nombre: "Est. Pérez", cedula: "1745678901", cargo: "Estudiante", activo: true, fechaIngreso: "2022-03-01" },
    { idUsuario: 5, nombre: "Ex-Miembro", cedula: "1734567890", cargo: "Investigador", activo: false, fechaIngreso: "2018-01-01" },
];

describe("validarEditGrupo — validación del formulario de edición", () => {
    it("acepta formulario completo válido", () => {
        expect(validarEditGrupo({ ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "GIDI Test", codigoGrupo: "GIDI" })).toBeNull();
    });

    it("rechaza nombre vacío", () => {
        expect(validarEditGrupo({ ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "", codigoGrupo: "GIDI" })).toContain("nombre");
    });

    it("rechaza código vacío", () => {
        expect(validarEditGrupo({ ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "Grupo Test", codigoGrupo: "" })).toContain("código");
    });

    it("rechaza código de 1 carácter", () => {
        expect(validarEditGrupo({ ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "Grupo Test", codigoGrupo: "G" })).toContain("2");
    });

    it("rechaza código mayor a 20 caracteres", () => {
        expect(validarEditGrupo({ ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "Grupo Test", codigoGrupo: "A".repeat(21) })).toContain("20");
    });
});

describe("hayCambios — detección de dirty state", () => {
    const grupoOriginal: GrupoDetalle = {
        idGrupo: 1, nombreGrupo: "GIDI", codigoGrupo: "GIDI001", descripcion: "Desc original",
        mision: null, vision: null, lineaInvestigacion: null, activo: true,
        fechaConstitucion: "2020-01-01", coordinadorNombre: "Dr. Torres"
    };

    it("retorna false cuando no hay cambios", () => {
        const draft = { ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "GIDI", codigoGrupo: "GIDI001", descripcion: "Desc original" };
        expect(hayCambios(grupoOriginal, draft)).toBe(false);
    });

    it("retorna true cuando cambia el nombre", () => {
        const draft = { ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "GIDI Modificado", codigoGrupo: "GIDI001", descripcion: "Desc original" };
        expect(hayCambios(grupoOriginal, draft)).toBe(true);
    });

    it("retorna true cuando cambia la descripción", () => {
        const draft = { ...GRUPO_DRAFT_DEFAULT, nombreGrupo: "GIDI", codigoGrupo: "GIDI001", descripcion: "Nueva descripción" };
        expect(hayCambios(grupoOriginal, draft)).toBe(true);
    });
});

describe("buscarInvestigador — búsqueda de miembros", () => {
    it("retorna todos con query vacío", () => {
        expect(buscarInvestigador(MOCK_MIEMBROS, "")).toHaveLength(5);
    });

    it("filtra por nombre", () => {
        const result = buscarInvestigador(MOCK_MIEMBROS, "torres");
        expect(result).toHaveLength(1);
        expect(result[0].cargo).toBe("Coordinador");
    });

    it("filtra por cédula", () => {
        const result = buscarInvestigador(MOCK_MIEMBROS, "1798765432");
        expect(result).toHaveLength(1);
        expect(result[0].nombre).toContain("Ruiz");
    });
});

describe("clasificarPorCargo — agrupación por cargo", () => {
    it("agrupa correctamente en Coordinador, Investigador, Estudiante", () => {
        const result = clasificarPorCargo(MOCK_MIEMBROS);
        expect(result["Coordinador"]).toHaveLength(1);
        expect(result["Investigador"]).toHaveLength(3); // incluye el inactivo
        expect(result["Estudiante"]).toHaveLength(1);
    });
});

describe("excapeCapacidad — límite de miembros activos", () => {
    it("retorna false cuando hay menos de 20 miembros activos", () => {
        expect(excapeCapacidad(MOCK_MIEMBROS)).toBe(false);
    });

    it("retorna true cuando hay 20+ miembros activos", () => {
        const full = Array.from({ length: 20 }, (_, i) => ({
            idUsuario: i + 100, nombre: `User ${i}`, cedula: `${1700000000 + i}`,
            cargo: "Investigador", activo: true, fechaIngreso: null
        }));
        expect(excapeCapacidad(full)).toBe(true);
    });
});
