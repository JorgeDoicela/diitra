using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research;
using diitra_application.Research.Dtos;

namespace diitra_infrastructure.Research
{
    public class PeerReviewService : IPeerReviewService
    {
        private readonly IPeerReviewPortalService _portalService;
        private readonly IPeerReviewAdminService _adminService;
        private readonly IPeerReviewWorkflowService _workflowService;

        public PeerReviewService(
            IPeerReviewPortalService portalService,
            IPeerReviewAdminService adminService,
            IPeerReviewWorkflowService workflowService)
        {
            _portalService = portalService;
            _adminService = adminService;
            _workflowService = workflowService;
        }

        // ── Vista del Revisor ──────────────────────────────────────
        public Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId)
            => _portalService.GetPendingReviewsAsync(revisorId);

        public Task<IEnumerable<PeerReviewDto>> GetMyReviewsAsync(int revisorId)
            => _portalService.GetMyReviewsAsync(revisorId);

        public Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid)
            => _portalService.GetRubricaForRevisionAsync(revisionUuid);

        public Task<bool> SubmitEvaluationAsync(EvaluationDto dto)
            => _portalService.SubmitEvaluationAsync(dto);

        // ── Vista del Director / Admin ─────────────────────────────
        public Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync()
            => _adminService.GetArbitrajesActivosAsync();

        public Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync()
            => _adminService.GetArbitrajeStatsAsync();

        public Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid)
            => _adminService.GetArbitrajeByProjectAsync(projectUuid);

        // ── Gestión de Árbitros ────────────────────────────────────
        public Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(string query, bool soloExternos, string? projectUuid)
            => _adminService.SearchRevisoresAsync(query, soloExternos, projectUuid);

        public Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId)
            => _adminService.AsignarArbitroAsync(dto, directorId);

        public Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId)
            => _adminService.RevocarAsignacionAsync(revisionUuid, directorId);

        public Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId)
            => _adminService.ExtenderFechaLimiteAsync(revisionUuid, nuevaFecha, directorId);

        public Task<bool> UpdateProjectSettingsAsync(string projectUuid, PeerReviewSettingsDto dto)
            => _adminService.UpdateProjectSettingsAsync(projectUuid, dto);

        // ── Revisores Externos (sin cuenta institucional) ──────────
        public Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId)
            => _adminService.RegisterRevisorExternoAsync(dto, directorId);

        public Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync()
            => _adminService.GetRevisoresExternosAsync();

        // ── Cierre y Resolución ────────────────────────────────────
        public Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId)
            => _workflowService.CerrarArbitrajeAsync(projectUuid, directorId);

        public Task<byte[]> GenerateDictamenPdfAsync(string projectUuid, int directorId)
            => _workflowService.GenerateDictamenPdfAsync(projectUuid, directorId);

        public Task<bool> IniciarEjecucionAsync(string projectUuid, int directorId)
            => _workflowService.IniciarEjecucionAsync(projectUuid, directorId);

        // ── Compatibilidad legado ──────────────────────────────────
        public Task<string> AssignReviewerAsync(CreatePeerReviewDto dto)
            => _adminService.AssignReviewerAsync(dto);

        public Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId)
            => _adminService.GetProjectReviewsAsync(projectId);
    }
}