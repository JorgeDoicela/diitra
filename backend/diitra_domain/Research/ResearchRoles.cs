namespace diitra_domain.Research;

/// <summary>
/// Catálogo canónico centralizado de roles de investigación (Proyectos y Grupos).
/// Mapea de forma directa con la tabla inv_cat_roles para garantizar consistencia institucional CACES.
/// </summary>
public static class ResearchRoles
{
    public static class Project
    {
        public const string Director = "Director de Proyecto";
        public const string CoInvestigador = "Co-Investigador";
        public const string Semillerista = "Semillerista";

        public static readonly string[] All = { Director, CoInvestigador, Semillerista };
    }

    public static class Group
    {
        public const string Coordinador = "Coordinador de Grupo";
        public const string MiembroDocente = "Miembro Docente";
        public const string Semillerista = "Semillerista de Grupo";
        public const string ApoyoTecnico = "Personal de Apoyo Técnico";
        public const string InvestigadorExterno = "Investigador Externo / Asesor";

        public static readonly string[] All = { Coordinador, MiembroDocente, Semillerista, ApoyoTecnico, InvestigadorExterno };
    }

    /// <summary>
    /// Normaliza cualquier texto o rol de entrada hacia el conjunto canónico de Proyectos.
    /// </summary>
    public static string NormalizeProjectRole(string? role, string? tipoPersona = null)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return (tipoPersona?.Equals("ESTUDIANTE", StringComparison.OrdinalIgnoreCase) == true ||
                    tipoPersona?.Equals("ALUMNO", StringComparison.OrdinalIgnoreCase) == true)
                ? Project.Semillerista
                : Project.CoInvestigador;
        }

        var r = role.Trim().ToLowerInvariant();
        if (r.Contains("director") || r.Contains("coordinador") || r.Contains("principal"))
            return Project.Director;
        if (r.Contains("semillerista") || r.Contains("estudiante") || r.Contains("alumno"))
            return Project.Semillerista;

        return Project.CoInvestigador;
    }

    /// <summary>
    /// Normaliza cualquier texto o rol de entrada hacia el conjunto canónico de Grupos.
    /// </summary>
    public static string NormalizeGroupRole(string? role, string? tipoPersona = null)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            if (tipoPersona?.Equals("ESTUDIANTE", StringComparison.OrdinalIgnoreCase) == true ||
                tipoPersona?.Equals("ALUMNO", StringComparison.OrdinalIgnoreCase) == true)
                return Group.Semillerista;
            if (tipoPersona?.Equals("ADMINISTRATIVO", StringComparison.OrdinalIgnoreCase) == true)
                return Group.ApoyoTecnico;
            if (tipoPersona?.Equals("EXTERNO", StringComparison.OrdinalIgnoreCase) == true)
                return Group.InvestigadorExterno;

            return Group.MiembroDocente;
        }

        var r = role.Trim().ToLowerInvariant();
        if (r.Contains("coordinador") || r.Contains("director") || r.Contains("líder") || r.Contains("lider"))
            return Group.Coordinador;
        if (r.Contains("semillerista") || r.Contains("estudiante") || r.Contains("alumno"))
            return Group.Semillerista;
        if (r.Contains("apoyo") || r.Contains("técnico") || r.Contains("tecnico") || r.Contains("administrativo"))
            return Group.ApoyoTecnico;
        if (r.Contains("externo") || r.Contains("asesor"))
            return Group.InvestigadorExterno;

        return Group.MiembroDocente;
    }

    /// <summary>
    /// Mapea un rol de grupo hacia el rol equivalente en un proyecto (para proyectos asociativos).
    /// </summary>
    public static string MapGroupRoleToProjectRole(string? groupRole, string? tipoPersona = null, bool isAlreadyDirector = false)
    {
        var normalizedGroup = NormalizeGroupRole(groupRole, tipoPersona);

        if (normalizedGroup == Group.Coordinador)
        {
            return isAlreadyDirector ? Project.CoInvestigador : Project.Director;
        }

        if (normalizedGroup == Group.Semillerista)
        {
            return Project.Semillerista;
        }

        return Project.CoInvestigador;
    }

    /// <summary>
    /// Determina si un rol corresponde al Director de Proyecto.
    /// </summary>
    public static bool IsProjectDirector(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        return role.Trim().ToLowerInvariant().Contains("director");
    }

    /// <summary>
    /// Determina si un rol corresponde a un estudiante o semillerista.
    /// </summary>
    public static bool IsStudentRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;
        var r = role.Trim().ToLowerInvariant();
        return r.Contains("semillerista") || r.Contains("estudiante") || r.Contains("alumno");
    }
}
