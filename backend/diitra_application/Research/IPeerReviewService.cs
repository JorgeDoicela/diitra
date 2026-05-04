using diitra_domain.Research;

using diitra_application.Research.Dtos;

namespace diitra_application.Research;

public interface IPeerReviewService
{
    Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId);
    Task<string> AssignReviewerAsync(CreatePeerReviewDto dto);
    Task<bool> SubmitEvaluationAsync(EvaluationDto dto);
    Task<IEnumerable<PeerReviewDto>> GetProjectReviewsAsync(int projectId);
}
