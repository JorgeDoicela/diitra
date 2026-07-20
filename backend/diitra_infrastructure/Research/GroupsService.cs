using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research;
using diitra_application.Research.Dtos;

namespace diitra_infrastructure.Research
{
    public class GroupsService : IGroupsService
    {
        private readonly IGroupsQueryService _queryService;
        private readonly IGroupsWorkflowService _workflowService;

        public GroupsService(
            IGroupsQueryService queryService,
            IGroupsWorkflowService workflowService)
        {
            _queryService = queryService;
            _workflowService = workflowService;
        }

        public Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null, string? userSigafiId = null, bool isAdmin = false, string? memberCedula = null)
            => _queryService.GetAllAsync(search, userSigafiId, isAdmin, memberCedula);

        public Task<GroupDto?> GetByUuidAsync(string uuid)
            => _queryService.GetByUuidAsync(uuid);

        public Task<GroupDto> CreateAsync(CreateGroupDto dto, string? solicitanteNombre = null)
            => _workflowService.CreateAsync(dto, solicitanteNombre);

        public Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto, string? solicitanteNombre = null)
            => _workflowService.UpdateAsync(uuid, dto, solicitanteNombre);

        public Task<bool> DeactivateAsync(string uuid)
            => _workflowService.DeactivateAsync(uuid);

        public Task<bool> DeleteAsync(string uuid, string? userIdRef = null)
            => _workflowService.DeleteAsync(uuid, userIdRef);

        public Task<bool> RestoreAsync(string uuid, string? userIdRef = null)
            => _workflowService.RestoreAsync(uuid, userIdRef);

        public Task<bool> PurgeAsync(string uuid, string? userIdRef = null)
            => _workflowService.PurgeAsync(uuid, userIdRef);

        public Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto)
            => _workflowService.AddMemberAsync(groupUuid, memberDto);

        public Task<bool> RemoveMemberAsync(int memberId, string? reason)
            => _workflowService.RemoveMemberAsync(memberId, reason);

        public Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion)
            => _workflowService.ReviewGroupAsync(uuid, aprobado, resolucion);

        public Task<bool> StartReviewAsync(string uuid)
            => _workflowService.StartReviewAsync(uuid);

        public Task<bool> CancelReviewAsync(string uuid)
            => _workflowService.CancelReviewAsync(uuid);

        public Task<IEnumerable<GroupDto>> GetPublicGroupsAsync(string? search = null)
            => _queryService.GetPublicGroupsAsync(search);

        public Task<GroupDto?> GetPublicGroupByUuidAsync(string uuid)
            => _queryService.GetPublicGroupByUuidAsync(uuid);
    }
}
