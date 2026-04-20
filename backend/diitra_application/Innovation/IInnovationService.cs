using diitra_domain.Innovation;

namespace diitra_application.Innovation;

public interface IInnovationService
{
    Task<IEnumerable<InnovacionProyecto>> GetAllInnovationProjectsAsync();
    Task<InnovacionProyecto?> GetInnovationProjectByIdAsync(int id);
    Task<int> RegisterPatentAsync(InnovacionProyecto patent);
}
