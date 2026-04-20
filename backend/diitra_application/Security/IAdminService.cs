using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAdminService
{
    Task<List<UserManagementDto>> GetProfessorsAsync(string? searchTerm);
    Task<bool> AssignRoleAsync(string idProfesor, string roleName);
    Task<bool> RevokeRoleAsync(string idProfesor, string roleName);
}
