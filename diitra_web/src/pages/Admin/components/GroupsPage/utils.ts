export const formatUserDetails = (u: any) => {
    if (!u) return '';
    const parts = [`C.I. ${u.cedula || 'S/D'}`];
    if (u.email && u.email.trim() !== '' && u.email !== 'S/D') {
        parts.push(u.email);
    }
    if (u.carrera && u.carrera.trim() !== '' && u.carrera !== 'S/D') {
        const formattedCarrera = u.carrera
            .toLowerCase()
            .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
            .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
        parts.push(formattedCarrera);
    }
    return parts.join(' | ');
};

export const formatCareerName = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
};

export const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const getGroupChanges = (fresh: any, local: any, skipMembers = false): string[] => {
    if (!fresh || !local) return [];
    const changes: string[] = [];

    const norm = (val: any) => (val || '').toString().trim();

    if (norm(fresh.nombre) !== norm(local.nombre)) changes.push("Nombre");
    if (norm(fresh.siglas) !== norm(local.siglas)) changes.push("Acrónimo/Siglas");
    if (norm(fresh.tipo_grupo) !== norm(local.tipo_grupo)) changes.push("Tipo de Grupo");
    if (norm(fresh.id_dominio) !== norm(local.id_dominio)) changes.push("Dominio Académico");
    if (norm(fresh.id_profesor_coordinador) !== norm(local.id_profesor_coordinador)) changes.push("Coordinador");
    if (norm(fresh.objetivo_general) !== norm(local.objetivo_general)) changes.push("Objetivo General");
    if (norm(fresh.mision) !== norm(local.mision)) changes.push("Misión");
    if (norm(fresh.vision) !== norm(local.vision)) changes.push("Visión");

    const freshLines = (fresh.lineas_ids || []).slice().sort().join(',');
    const localLines = (local.lineas_ids || []).slice().sort().join(',');
    if (freshLines !== localLines) changes.push("Líneas de Investigación");

    // Comparar miembros solo cuando ambos objetos vienen del endpoint de detalle completo
    if (!skipMembers && fresh.miembros !== undefined && local.miembros !== undefined) {
        const freshMembers = (fresh.miembros || []).filter((m: any) => m.activo).map((m: any) => m.cedula || '').sort().join(',');
        const localMembers = (local.miembros || []).filter((m: any) => m.activo).map((m: any) => m.cedula || '').sort().join(',');
        if (freshMembers !== localMembers) changes.push("Integrantes / Miembros");
    }

    return changes;
};
