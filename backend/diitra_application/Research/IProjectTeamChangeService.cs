using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IProjectTeamChangeService
    {
        Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request);
        Task<List<TeamChangeRequestRecordDto>> GetTeamChangeRequestsAsync(string projectUuid);
        Task<SyncResult> ReviewTeamChangeRequestAsync(string projectUuid, string requestUuid, string reviewerSigafiId, TeamChangeReviewDto review);
    }
}
