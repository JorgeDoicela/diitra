using System.Collections.Generic;

namespace diitra_application.Security.DTOs;

public class UserManagementDto
{
    public string IdProfesor { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string UserUuid { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public List<string> RoleCodes { get; set; } = new();
}

public class RoleActionRequest
{
    public string IdProfesor { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string RoleCode { get; set; } = string.Empty;
}
