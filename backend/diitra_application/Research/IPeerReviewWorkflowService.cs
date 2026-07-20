using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_application.Research
{
    public interface IPeerReviewWorkflowService
    {
        Task<DictamenDto> CerrarArbitrajeAsync(string projectUuid, int directorId);
        Task<byte[]> GenerateDictamenPdfAsync(string projectUuid, int directorId);
        Task<bool> IniciarEjecucionAsync(string projectUuid, int directorId);
    }
}
