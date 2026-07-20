using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_application.Research
{
    public interface IGroupsWorkflowService
    {
        Task<GroupDto> CreateAsync(CreateGroupDto dto, string? solicitanteNombre = null);
        Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto, string? solicitanteNombre = null);
        Task<bool> DeactivateAsync(string uuid);
        Task<bool> DeleteAsync(string uuid, string? userIdRef = null);
        Task<bool> RestoreAsync(string uuid, string? userIdRef = null);
        Task<bool> PurgeAsync(string uuid, string? userIdRef = null);
        Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto);
        Task<bool> RemoveMemberAsync(int memberId, string? reason);
        Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion);
        Task<bool> StartReviewAsync(string uuid);
        Task<bool> CancelReviewAsync(string uuid);
    }
}
