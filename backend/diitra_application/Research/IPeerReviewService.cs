using diitra_domain.Research;

namespace diitra_application.Research;

public interface IPeerReviewService
{
    Task<IEnumerable<string>> AssignReviewersAsync(int projectId, string authorDepartment);
}
