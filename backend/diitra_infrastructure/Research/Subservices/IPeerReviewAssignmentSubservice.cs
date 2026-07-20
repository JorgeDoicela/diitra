using System;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IPeerReviewAssignmentSubservice
    {
        Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId);
        Task<string> AssignReviewerAsync(CreatePeerReviewDto dto);
        Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId);
        Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId);
        Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto);
    }
}
