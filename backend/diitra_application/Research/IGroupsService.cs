using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IGroupsService
{
    Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null);
    Task<GroupDto?> GetByUuidAsync(string uuid);
    Task<GroupDto> CreateAsync(CreateGroupDto dto);
    Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto);
    Task<bool> DeactivateAsync(string uuid);
    Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto);
    Task<bool> RemoveMemberAsync(int memberId);
    Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion);
}
