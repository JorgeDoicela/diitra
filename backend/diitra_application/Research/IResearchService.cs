using diitra_domain.Research;

namespace diitra_application.Research;

public interface IResearchService
{
    Task<IEnumerable<InvestigacionProyecto>> GetAllProposalsAsync();
    Task<InvestigacionProyecto?> GetProposalByIdAsync(int id);
    Task<InvestigacionProyecto?> GetProposalByUuidAsync(string uuid);
    Task<int> SubmitProposalAsync(InvestigacionProyecto proposal);
}
