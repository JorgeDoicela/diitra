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
    Task<bool> ExtenderFechaLimiteAsync(string revisionUuid, DateTime nuevaFecha, int directorId);
    Task<PeerReviewSettingsDto> GetSettingsAsync();
    Task<bool> UpdateSettingsAsync(PeerReviewSettingsDto dto);

    // ── Revisores Externos (sin cuenta institucional) ──────────
    Task<string> RegisterRevisorExternoAsync(RegistrarRevisorExternoDto dto, int directorId);
    Task<IEnumerable<RevisorDisponibleDto>> GetRevisoresExternosAsync();

    // ── Cierre y Resolución ────────────────────────────────────
    Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId);
    Task<byte[]> GenerateDictamenPdfAsync(string projectUuid, int directorId);

    /// <summary>
    /// Transiciona un proyecto de "Aprobado" a "En Ejecución" para iniciar la fase operativa CACES.
    /// </summary>
    Task<bool> IniciarEjecucionAsync(string projectUuid, int directorId);

    // ── Compatibilidad legado ──────────────────────────────────
    Task<string> AssignReviewerAsync(CreatePeerReviewDto dto);
    Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId);
}
