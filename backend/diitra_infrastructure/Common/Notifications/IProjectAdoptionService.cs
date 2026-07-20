using System.Collections.Generic;
using System.Threading.Tasks;

namespace diitra_infrastructure.Common.Notifications
{
    public interface IProjectAdoptionService
    {
        Task<IEnumerable<object>> GetUnfinishedProjectsAsync();
        Task<bool> MarkProjectAsUnfinishedAsync(int projectId, string reason, int? adminUserId = null);
        Task<bool> AdoptProjectAsync(int projectId, int newDirectorUserId);
    }
}
