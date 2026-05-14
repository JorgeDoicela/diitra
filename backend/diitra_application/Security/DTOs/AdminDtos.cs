using System.Collections.Generic;

namespace diitra_application.Security.DTOs;

public class UserManagementDto
{
    public int? IdUsuario { get; set; }
    public string IdProfesor { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserUuid { get; set; } = string.Empty;
    public string Type { get; set; } = "DOCENTE"; // DOCENTE, ESTUDIANTE, EXTERNO
    public List<string> Roles { get; set; } = new();
    public List<string> RoleCodes { get; set; } = new();

    // Metadata resumida para la lista
    public string? OrcidId { get; set; }
    public bool FirmaHabilitada { get; set; }
    public decimal? HorasInvestigacion { get; set; }
    public string? TipoDedicacion { get; set; }
    
    // Contexto Académico (Profesionalización)
    public string? Carrera { get; set; }
    public string? Nivel { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class UserMetadataDto
{
    public string? OrcidId { get; set; }
    public string? ScopusId { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public string? ResearchGateUrl { get; set; }
    public string? Especialidad { get; set; }
    public string? GradoAcademicoMaximo { get; set; }
}

public class RoleDto
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string CodigoRol { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class RoleActionRequest
{
    public string IdUsuario { get; set; } = string.Empty; // Soporta idProfesor o idAlumno
    public string RoleName { get; set; } = string.Empty;
    public string RoleCode { get; set; } = string.Empty;
    public string UserType { get; set; } = "DOCENTE";
}

public class AuditLogDto
{
    public int IdAudit { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string TargetName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Modulo { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? ValuesBefore { get; set; } // JSON
    public string? ValuesAfter { get; set; }  // JSON
    public DateTime Date { get; set; }
}

public class ExternalUserDto
{
    public string Cedula { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Especialidad { get; set; }
    public string? GradoAcademico { get; set; }
    public string? Institucion { get; set; }
    public string DefaultRole { get; set; } = "DIITRA_REVISOR_EXTERNO";
}
