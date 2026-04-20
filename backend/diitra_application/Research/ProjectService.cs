using diitra_application.Research.Dtos;
using diitra_domain.Research;
using diitra_domain.Common;

namespace diitra_application.Research;

public class ProjectService : IResearchService
{
    private const decimal MAX_BUDGET = 5000; // Institutional limit example

    public async Task<int> SubmitProposalAsync(InvestigacionProyecto proposal)
    {
        // 1. Budget Guard
        if (proposal.PresupuestoAsignado > MAX_BUDGET)
        {
            throw new InvalidOperationException($"El presupuesto excede el límite institucional de ${MAX_BUDGET}.");
        }

        // 2. Format Validation logic (Stub)
        // In a real scenario, we'd check the byte stream for PDF magic numbers

        // 3. Persist (Placeholder for Repo)
        await Task.CompletedTask;
        return 1; // Simulated ID
    }

    public async Task<IEnumerable<InvestigacionProyecto>> GetAllProposalsAsync()
    {
        return await Task.FromResult(new List<InvestigacionProyecto>());
    }

    public async Task<InvestigacionProyecto?> GetProposalByIdAsync(int id)
    {
        return await Task.FromResult<InvestigacionProyecto?>(null);
    }
}
