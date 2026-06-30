using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAdminService
{
    Task<PagedResult<UserManagementDto>> GetUsersAsync(string? searchTerm, string type = "DOCENTE", int page = 1, int pageSize = 10, string? carrera = null);
    Task<List<RoleDto>> GetAvailableRolesAsync();
    Task<UserMetadataDto?> GetUserMetadataAsync(string userUuid);
    Task<bool> UpdateUserMetadataAsync(string userUuid, UserMetadataDto dto);
    Task<bool> AssignRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE");
    Task<bool> RevokeRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE");
    Task<bool> RegisterExternalUserAsync(ExternalUserDto dto);
    Task<List<AuditLogDto>> GetRecentAuditLogsAsync();
    Task<PagedResult<AuditLogDto>> GetAuditLogsPagedAsync(DateTime? from, DateTime? to, string? action, string? modulo, string? searchTerm, int page = 1, int pageSize = 20);
}
