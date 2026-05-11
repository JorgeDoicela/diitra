using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAdminService
{
    Task<PagedResult<UserManagementDto>> GetUsersAsync(string? searchTerm, string type = "DOCENTE", int page = 1, int pageSize = 10);
    Task<List<RoleDto>> GetAvailableRolesAsync();
    Task<UserMetadataDto?> GetUserMetadataAsync(string userUuid);
    Task<bool> UpdateUserMetadataAsync(string userUuid, UserMetadataDto dto, string? adminUsername = null);
    Task<bool> AssignRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE", string? adminUsername = null);
    Task<bool> RevokeRoleAsync(string idUsuario, string roleCode, string userType = "DOCENTE", string? adminUsername = null);
    Task<bool> RegisterExternalUserAsync(ExternalUserDto dto, string? adminUsername = null);
    Task<List<AuditLogDto>> GetRecentAuditLogsAsync();
}
