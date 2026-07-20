using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_application.Research
{
    public interface IPeerReviewAdminService
    {
        Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync();
        Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync();
        Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid);
        Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(string query, bool soloExternos, string? projectUuid);
        Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId);
        Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId);
        Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId);
        Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto);
        Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId);
        Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync();
        Task<string> AssignReviewerAsync(CreatePeerReviewDto dto);
        Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId);
    }
}
