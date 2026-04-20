namespace diitra_application.Research;

public class PeerReviewService : IPeerReviewService
{
    private readonly List<string> _mockReviewers = new() 
    { 
        "Sistemas", "Electrónica", "Mecánica", "Administración", "Turismo" 
    };

    public async Task<IEnumerable<string>> AssignReviewersAsync(int projectId, string authorDepartment)
    {
        // Doble Ciego Algorithm:
        // 1. Filter reviewers that are NOT from the same department
        var eligibleReviewers = _mockReviewers.Where(r => r != authorDepartment).ToList();

        // 2. Randomly select 2
        var random = new Random();
        var selected = eligibleReviewers.OrderBy(x => random.Next()).Take(2);

        await Task.CompletedTask;
        return selected;
    }
}
