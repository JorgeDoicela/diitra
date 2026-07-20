using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_application.Research
{
    public interface IPeerReviewPortalService
    {
        Task<IEnumerable<PeerReviewDto>> GetPendingReviewsAsync(int revisorId);
        Task<IEnumerable<PeerReviewDto>> GetMyReviewsAsync(int revisorId);
        Task<RubricaDinamicaDto?> GetRubricaForRevisionAsync(string revisionUuid);
        Task<bool> SubmitEvaluationAsync(EvaluationDto dto);
    }
}
