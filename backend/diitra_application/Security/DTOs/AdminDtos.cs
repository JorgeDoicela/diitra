using System.Collections.Generic;

namespace diitra_application.Security.DTOs;

public class UserManagementDto
{
    public string IdProfesor { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserUuid { get; set; } = string.Empty;
    public string Type { get; set; } = "DOCENTE"; // DOCENTE, ESTUDIANTE
    public List<string> Roles { get; set; } = new();
    public List<string> RoleCodes { get; set; } = new();
    
    // Metadata resumida para la lista
    public string? OrcidId { get; set; }
    public bool FirmaHabilitada { get; set; }
    public decimal? HorasInvestigacion { get; set; }
    public string? TipoDedicacion { get; set; }
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
    public string? Details { get; set; }
    public DateTime Date { get; set; }
}

public class ExternalUserDto
{
    public string Cedula { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DefaultRole { get; set; } = "EVALUADOR_PAR";
}
