using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IPeerReviewService
{
    // ── Vista del Revisor ──────────────────────────────────────
    Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId);
    Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid);
    Task<bool> SubmitEvaluationAsync(EvaluationDto dto);

    // ── Vista del Director / Admin ─────────────────────────────
    Task<IEnumerable<ArbitrajeProyectoDto>> GetArbitrajesActivosAsync();
    Task<ArbitrajeStatsDto> GetArbitrajeStatsAsync();
    Task<ArbitrajeProyectoDto?> GetArbitrajeByProjectAsync(string projectUuid);

    // ── Gestión de Árbitros ────────────────────────────────────
    Task<IEnumerable<RevisorDisponibleDto>> SearchRevisoresAsync(string query, bool soloExternos, string? projectUuid);
    Task<string> AsignarArbitroAsync(AsignarArbitroDto dto, int directorId);
    Task<bool> RevocarAsignacionAsync(string revisionUuid, int directorId);

    // ── Cierre y Resolución ────────────────────────────────────
    Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId);

    // ── Compatibilidad legado ──────────────────────────────────
    Task<string> AssignReviewerAsync(CreatePeerReviewDto dto);
    Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId);
}

