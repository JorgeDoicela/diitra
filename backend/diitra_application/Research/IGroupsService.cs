using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IGroupsService
{
    Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null, string? userSigafiId = null, bool isAdmin = false);
    Task<GroupDto?> GetByUuidAsync(string uuid);
    Task<GroupDto> CreateAsync(CreateGroupDto dto, string? solicitanteNombre = null);
    Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto, string? solicitanteNombre = null);
    Task<bool> DeactivateAsync(string uuid);
    Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto);
    Task<bool> RemoveMemberAsync(int memberId, string? reason);
    Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion);
}
